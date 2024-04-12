import mongoose, { Mongoose } from "mongoose";

mongoose.connect("mongodb://localhost:27017/SC2006PROJECT")
.then(()=>{
    console.log('mongoose connected');
})
.catch((e)=>{
    console.log('failed');
})

const SignUpSchema=new mongoose.Schema({
    email:{
        type:String,
        required:true
    },
    username:{
        type:String,
        required:true
    },
    password:{
        type:String,
        required:true
    },
    invitationcode:{
        type:String,
        required:true,
    },
    spending: {
        type: Number,
        required: true,
        default: 0 // Keeps the initial spending value
    },
    debt: {
        type: Map, // Using a Map to store key-value pairs
        of: Number, // Assuming the values are meant to represent numbers
        required: true,
        default: {} // Starts with an empty object
    },
    paynowNumber:{
        type:Number,
        required: true,
         default:0
    }
});

const signupcollection = mongoose.model('UserData', SignUpSchema, 'UserData');

const BillSchema=new mongoose.Schema({
    name:{
        type:String,
        required:true,
    },
    title:{
        type:String,
        required:true
    },
    amount:{
        type:Number,
        required:true
    },
    paynowNumber:{
        type:Number,
        required: true
    }
});

const BillCollection = mongoose.model('BillData', BillSchema, 'BillData');


const PlanSchema = new mongoose.Schema({
    planName: {
      type: String,
      required: true,
    },
    events: {
      type: Object,
      of: String
    }
  });

const plancollection = mongoose.model('Plandata',PlanSchema,'Plandata');

export { signupcollection, BillCollection, plancollection };
