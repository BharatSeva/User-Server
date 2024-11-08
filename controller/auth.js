const StatusCode = require("http-status-codes")
const auth = require("../schema/auth")
const info = require("../schema/info")
const { channel, connection } = require("../rabbitmq/connect")


// all these logs will puts in comman channel "logs" shared by both User and Healthcare
const register = async (req, res) => {
    try {
        let { health_id, email } = req.body
        const FindUser = await info.findOne({ health_id, email })
        if (!FindUser) {
            res.status(StatusCode.BAD_REQUEST).json({ status: "No User Found With Given Health ID", message: "HealthCare Need To Register You Before You Login.." })
            return;
        }

        // push into queue for logs
        const QUEUE_NAME = 'logs';
        const msgChannel = channel();
        if (!msgChannel) {
            return res.status(StatusCode.INTERNAL_SERVER_ERROR).json({ message: "RabbitMQ channel is not available." });
        }
        const payload = {
            email: email,
            health_id: health_id,
            category: "patientRegister",
            // message: "Registeration Detected",
            IP_ADDR: req.ip
        };
        msgChannel.sendToQueue(QUEUE_NAME, Buffer.from(JSON.stringify(payload)), {
            persistent: true,
        });
        /////////////////////////////////////////
        /////////////////////////////////////////

        const IsUser = await auth.findOne({ health_id })
        if (IsUser) {
            res.status(StatusCode.BAD_REQUEST).json({ status: "User Already Registered!" })
            return
        }


        req.body.name = FindUser.fname + " " + FindUser.lname;
        if (FindUser.email === req.body.email) {
            await auth.create(req.body)
            res.status(StatusCode.CREATED).json({ status: "Successfully Registered, Now You Can Login..." })
        } else {
            res.status(StatusCode.BAD_REQUEST).json({ status: "Email Mismatched", message: "Use the same email address that you provided for HealthCare registration" })
        }

    } catch (err) {
        console.log(err)

        res.status(StatusCode.INTERNAL_SERVER_ERROR).json({ status: "Something Bad Happened!" })
    }
}

const login = async (req, res) => {
    try {
        const { health_id, password } = req.body
        const Patient = await auth.findOne({ health_id })
        if (!Patient) {
            res.status(StatusCode.BAD_REQUEST).json({ message: "No User Exits with Given Credentials" })
            return;
        }

        // push into queue for logs
        const QUEUE_NAME = 'logs';
        const msgChannel = channel();
        if (!msgChannel) {
            return res.status(StatusCode.INTERNAL_SERVER_ERROR).json({ message: "RabbitMQ channel is not available." });
        }
        const payload = {
            health_id: health_id,
            email: Patient.email,
            category: "patientLogin",
            name: Patient.name,
            // message: "Login Detected",
            IP_ADDR: req.ip
        };
        msgChannel.sendToQueue(QUEUE_NAME, Buffer.from(JSON.stringify(payload)), {
            persistent: true,
        });

        const IspasswordCorrect = await Patient.P_comparePass(password)
        if (!IspasswordCorrect) {
            res.status(StatusCode.BAD_REQUEST).json({ message: "Incorrect Password!" })
            return;
        }

        const token = Patient.P_createJWT();

        res.status(StatusCode.ACCEPTED).json({
            fullname: Patient.name,
            health_id: Patient.health_id,
            token
        })
    }
    catch (err) {
        console.log(err)
        res.status(StatusCode.INTERNAL_SERVER_ERROR).json({ message: err.message })
    }
}



module.exports = {
    register,
    login
}