const express = require('express');
const { checkInteger, checkFloat, isDuplicateEntityName, isOverlapping } = require('./utils')

const port = 8000
const app = express()
app.use(express.json())

let rooms = []
let customers = []
let bookings = []

app.get('/', (req, res) => {
    try {
        res.status(200).send({
            msg: "Use the routes described below to access the different functionalities.",
            routes: [
                {
                    route: "/room",
                    functionality: "Create a room."
                },
                {
                    route: "/rooms",
                    functionality: "List of all rooms."
                },
                {
                    route: "/customer",
                    functionality: "Create a customer."
                },
                {
                    route: "/book",
                    functionality: "Book a room."
                },
                {
                    route: "/bookings",
                    functionality: "List of all bookings"
                },
                {
                    route: "/bookings/:customerName/:roomName",
                    functionality: "List of all bookings by {customerName} for {roomName}."
                },
            ]
        })

    } catch (e) {
        console.log(e)
        return res.status(500).send({
            "msg": "There was an error creating the room. Please try again after some time."
        })
    }
})

app.post('/room', (req, res) => {
    try {
        let newRoom = req.body;
        
        // check for presence of required fields
        if (!newRoom.name || !newRoom.seats || !newRoom.amenities || !newRoom.hourlyRate) {
            return res.status(400).send({
                "msg": "The following fields are required:",
                "fields": [
                    {"name": "Name of the room"},
                    {"seats": "Number of seats available in the room"},
                    {"amenities": "Amenities available in the room"},
                    {"hourlyRate": "Hourly rate of the room"}
                ]
            })
        }
        
        // check if the number of seats is a legal value
        if (!checkInteger(newRoom.seats)) {
            return res.status(400).send({
                "msg": "`seats` must be an integer"
            })
        }

        // check if hourly rate is a legal value
        if (!checkInteger(newRoom.hourlyRate) && !checkFloat(newRoom.hourlyRate)) {
            return res.status(400).send({
                "msg": "`hourlyRate` must be an integer or float (decimal)."
            })
        }

        // check if room name is duplicate
        if (isDuplicateEntityName(rooms, newRoom.name)) {
            return res.status(400).send({
                "msg": "A room with the same name already exists."
            })
        }

        rooms.push({
            id: rooms.length + 1,
            name: newRoom.name,
            seats: newRoom.seats,
            amenities: newRoom.amenities,
            hourlyRate: newRoom.hourlyRate,
            isBooked: false
        })

        return res.status(201).send({
            "msg": "Successfully created new room.",
            "room": rooms[rooms.length - 1]
        })

    } catch (e) {
        console.log(e)
        return res.status(500).send({
            "msg": "There was an error creating the room. Please try again after some time."
        })
    }
})

app.post('/customer', (req, res) => {
    try {
        let newCustomer = req.body;

        // check for presense of required fields
        if (!newCustomer.name) {
            return res.status(400).send({
                "msg": "The following fields are required.",
                "fields": [
                    {"name": "Name of the customer"}
                ]
            })
        }

        // check if customer name is duplicate
        if (isDuplicateEntityName(customers, newCustomer.name)) {
            return res.status(400).send({
                "msg": "A customer with the same name already exists."
            })
        }

        customers.push({
            id: customers.length + 1,
            name: newCustomer.name
        })

        return res.status(201).send({
            "msg": "Successfully registered.",
            "customer": customers[customers.length - 1]
        })

    } catch (e) {
        console.log(e);
        return res.status(500).send({
            "msg": "There was an error registering the new customer. Please try after some time."
        })
    }

})

app.post('/book', (req, res) => {
    let newBooking = req.body;

    // check for existence of required fields
    if (!newBooking.roomId || !newBooking.customerName || !newBooking.date || !newBooking.startTime || !newBooking.endTime) {
        return res.status(400).send({
            "msg": "The following fields are required:",
            "fields": [
                {"roomId": "`id` of the room to book"},
                {"customerName": "name of the customer booking the room"},
                {"date": "date of booking"},
                {"startTime": "start time of booking"},
                {"endTime": "end time of booking"}
            ]
        })
    }
    // check for proper formating of date & time
    // pass

    // check for existence of room
    let bookedRoom = rooms.find(room => room.id === newBooking.roomId)
    if (!bookedRoom) {
        return res.status(400).send({
            "msg": "Room does not exist"
        })
    }

    // check for existence of customer
    let customer = customers.find(customer => customer.name === newBooking.customerName)
    if (!customer) {
        return res.status(400).send({
            "msg": "Customer doesn't exist"
        })
    }

    // prepare for inserting into datastore
    newBooking = {
        id: bookings.length + 1,
        bookingStringId: `${newBooking.roomId}-${newBooking.customerName}-${newBooking.date}-${newBooking.startTime}-${newBooking.endTime}`,
        bookingDate: (new Date()).toISOString(),
        roomName: bookedRoom.name,
        ...newBooking
    }

    // check for duplication
    let duplicateBooking = bookings.find(booking => booking.bookingStringId === newBooking.bookingStringId)
    if (duplicateBooking) {
        return res.status(400).send({
            "msg": "Booking already exists."
        })
    }

    // check for overlapping time slots
    let overlappingBookings = bookings.filter(booking => {
        timeslotA = {
            start: new Date(booking.date + "T" + booking.startTime + "Z"),
            end: new Date(booking.date + "T" + booking.endTime + "Z")
        }
        timeslotB = {
            start: new Date(newBooking.date + "T" + newBooking.startTime + "Z"),
            end: new Date(newBooking.date + "T" + newBooking.endTime + "Z")
        }
        return isOverlapping(timeslotA, timeslotB)
    })

    if (overlappingBookings.length > 0) {
        return res.status(400).send({
            "msg": `Timeslot overlaps with ${overlappingBookings.length} booking(s).`,
            "overlappingBookings": overlappingBookings
        })
    }

    // create booking
    bookings.push(newBooking)

    // update room status
    for (let room of rooms) {
        if (room.id === newBooking.roomId ) {
            room.isBooked = true;
        }
    }

    return res.status(201).send({
        "msg": "Succesfully booked room.",
        "booking": bookings[bookings.length - 1]
    })
})

app.get('/rooms', (req, res)=>{
    res.status(200).send({
        "msg": "List of all rooms",
        "rooms": rooms
    })
})

app.get('/bookings', (req, res)=>{
    res.status(200).send({
        "msg": "List of all bookings",
        "bookings": bookings
    })
})

app.get('/bookings/:customerName/:roomName', (req, res)=>{
    let cName = req.params.customerName
    let rName = req.params.roomName
    let customerBookings = bookings.filter(booking => booking.customerName === cName && booking.roomName === rName)
    res.status(200).send({
        "msg": `List of all bookings by ${cName} for ${rName}.`,
        "bookings": customerBookings
    })
})

app.listen(port, () => {
    console.log(`Server running.\nListening on port ${port}.`)
})