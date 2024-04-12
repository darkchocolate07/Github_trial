import express from "express";
import path from 'path';
import {dirname} from 'path'
import {fileURLToPath} from'url'
import session  from 'express-session';
import { createServer } from 'http';
import { Server as SocketIO } from 'socket.io';
import  formatMessage  from '../utils/messages.js';
import {userJoin, getCurrentUser, userLeave, getRoomUsers}  from'../utils/users.js';
import { signupcollection, BillCollection, plancollection }  from "./mongodb.js";


const app = express();
const httpServer = createServer(app);
const io = new SocketIO(httpServer);

const __dirname=dirname(fileURLToPath(import.meta.url));
//const __dirname=dirname(fileURLToPath(import.meta.url))





const pause = duration => new Promise(resolve => setTimeout(resolve, duration));
app.use(express.urlencoded({ extended: false }));
app.set('view engine', 'ejs');

const projectPath = __dirname;
var userdata;
var username,username_trial,invitation_trial;
var PlanName;

app.use('/images', express.static(path.join(projectPath, '../images')));
app.use('/css', express.static(path.join(projectPath, '../css')));
app.use('/js', express.static(path.join(projectPath, '../js')));
app.use('/css_chat',express.static(path.join(projectPath,'../public/css_chat')))
app.use('/js_chat',express.static(path.join(projectPath,'../public/js_chat')))
app.use('/public',express.static(path.join(projectPath,'../public')))
/*app.use('/views', express.static(path.join(projectPath, '../ejs')));*/
app.set('views', path.join(projectPath, '../ejs'));
app.use(express.json()); 

app.use(session({secret: 'your secret',  resave: false,  saveUninitialized: true,  cookie: { secure: false } // for HTTPS, set secure: true
}));

console.log(path.join(projectPath, '../images'));
const botName = 'Admin';
io.on('connection', socket => { 
  socket.on('joinRoom', ({username, invitation }) => {


  const validInvite = invitation_trial; // modify this to read from database
  
  if (invitation !== validInvite) {
      socket.emit('errorMessage', 'Invalid invitation code');
      return;
  }


  const user = userJoin(socket.id, username, invitation);

  socket.join(user.room);
  //welcomes current user
  socket.emit('message', formatMessage(botName, 'Welcome to Planify Chat'));

  //broadcast when a user connects
  //notifies everyone except user that they have connected to the server
  socket.broadcast.to(user.room).emit(
      'message', 
      formatMessage(botName,`${user.username} has joined the chat`));
  
      //send useres and room info
  io.to(user.room).emit('roomUsers',{
      room: user.room,
      users: getRoomUsers(user.room)
  });
});
  // Listen for chatMessage
  socket.on('chatMessage', msg =>{
      const user = getCurrentUser(socket.id);

      io.to(user.room).emit('message', formatMessage(user.username, msg));
  });

  //runs when client disconnects
  socket.on('disconnect', () => {
      const user = userLeave(socket.id);
      if(user){
          io.to(user.room).emit('message', formatMessage(botName,`${user.username} has left the chat`));
  
          //send useres and room info
          io.to(user.room).emit('roomUsers',{
              room: user.room,
              users: getRoomUsers(user.room)
          });
       }
  
  });
});


const port=3000;


app.get('/', (req, res) => {
    res.sendFile(path.join(projectPath,'../Landing_page.html'));
  });
app.get('/login', (req, res) => {
    res.sendFile(path.join(projectPath ,'../loginpage.html'));
  });
app.get('/signup', (req, res) => {
    res.sendFile(path.join(projectPath,'../signuppage.html'));
  });
app.get('/joinroom', (req, res) => {
    res.sendFile(path.join(projectPath, '../joinRoom.html'));
  });

app.get('/homepage', (req, res) => {
  if(req.session.isLoggedIn){
    // if user is authenticated, proceed to the next middleware/function
    res.sendFile(path.join(projectPath, '../homepage.html'));
  }
  else{
      return res.redirect('/login');
  }
  });



app.get('/settings',(req,res)=>{
  res.render('settings',userdata)
})

app.get('/Plan',async(req,res)=>{

  const username=username_trial;
  const invitation=invitation_trial;
  console.log(username_trial);
  console.log(invitation_trial);
  console.log(PlanName);
  // This would likely come from your invitation logic
  try
  {
    const check = await plancollection.findOne({ planName: PlanName });
    console.log(username,invitation);
    console.log(check);
    res.render('integratedPage', {
      planname: PlanName,
      username: username,
      invitation: invitation,
      events: check.events
    });
  }
  catch(error)
  {
    console.log(error);
    return res.redirect("/homepage?error=NOPlanAvailable");
  }
})
app.get('/recommended',(req,res)=>{
  res.sendFile(path.join(projectPath, '../navbar.html'));
})
app.get('/billsplitting', (req, res) => {
  res.sendFile(path.join(projectPath, '../bill_splitting.html'));
});

app.get('/makeaplan',(req,res)=>{
  res.sendFile(path.join(projectPath, '../Makeaplan.html'));
})
app.get('/recplaces',(req,res)=>{
  res.sendFile(path.join(projectPath,'../recplace.html'))
})
app.get('/recplan',(req,res)=>{
  res.sendFile(path.join(projectPath,'../recplan.html'))
})

// Express route to serve the chatroom page
app.get('/chatroom', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/chat.html'));
});

app.get('/chatroomfeature',(req,res)=>{
  res.redirect(`/chatroom?username=${(username_trial)}&invitation=${(invitation_trial)}`);
})







app.post('/makingplan',async(req,res)=>{

  const { planName, 'place[]': places, 'time[]': times } = req.body;
    
  // Assuming places and times are arrays of equal length
  let events = {};
  places.forEach((place, index) => {
      events[place] = times[index];
  });

  // Data structured for a single plan document
  const planData = {
      planName: planName,
      events: events
  };

  try {
      // Inserting a single document with the structured data
      PlanName = planData.planName;
      await plancollection.create(planData); // Using .create() for a single document
      res.redirect('/plan');
  } catch (error) {
      console.error("Error saving plan:", error);
      res.status(500).send("Error saving plan.");
  }
});

app.post('/signup',async(req,res)=>{
  const randomNumber = Math.floor(100000 + Math.random() * 900000);
  const data={
    email:req.body.Email,
    username:req.body.username,
    password:req.body.password,
    invitationcode:randomNumber
  }
  const checking1= await signupcollection.findOne({ email: req.body.Email })
  const checking2=await signupcollection.findOne({ username: req.body.username})

  try
  {
    if (checking1) 
    {
      console.log("Email already in use");
      return res.redirect('/signup?error=emailInUse');
    }
    if(checking2)
    {
      console.log("Username already in use");
      return res.redirect('/signup?error=usernameInUse');
    }
    else
    {
      userdata={username:data.username,email:data.email,password:data.password}
      username=userdata.username;
      username_trial=data.username;
      invitation_trial=data.invitationcode;
      await signupcollection.insertMany([data])
      console.log("SignUp Successful");
      req.session.isLoggedIn = true;
      res.redirect('/login');
    }
  }
  catch (error){
    console.log("SignUp Error : ",error);
   }
})


app.post('/login',async(req,res)=>{
  const data={
    username:req.body.username,
    password:req.body.password
  }
  try {
    const check = await signupcollection.findOne({ username: req.body.username })

    if (check.password === req.body.password) 
    {
      userdata={username:check.username,email:check.email,password:check.password}
      username_trial=check.username;
      invitation_trial=check.invitationcode;
      console.log(userdata);
      username=userdata.username;
      console.log("Login successful");
      req.session.isLoggedIn = true;
      return res.redirect('/homepage');
    }
    else 
    {
      console.log("Wrong Password");
      return res.redirect('/login?error=wrongpassword');
    }
  } 

  catch (e) 
  {
    console.log(e);
    console.log("Wrong Details");
    return res.redirect('/login?error=InvalidUername');
  }
})


app.post('/joinroom',async(req,res)=>{
  const data={
    name:req.body.Guestname,
    code:req.body.InvitationCode
  }
  try {
    const checking123 = await signupcollection.findOne({ invitationcode: req.body.InvitationCode.trim() })
    if(checking123)
    {
      //res.render('Plan',{guestname : data.name});
      var username=data.name;
      username_trial=data.name;
      invitation_trial=data.code
      return res.redirect('/plan');
      /*
      console.log(`/chatroom?username=${(username)}&invitation=${(invitation_trial)}`)
      return res.redirect(`/chatroom?username=${(username)}&invitation=${(invitation_trial)}`);*/
    }
    else
    {
      console.log("hmm");
       return res.redirect('/joinroom?error=Invalid')
    }
  } 
  catch (e) 
  {
    console.log(e);
    return res.redirect('/joinroom?error=InvalidCode');
  }
})

app.post('/updateEmail',async(req,res)=>{
  console.log(userdata);
  try {
    const updatedUser = await signupcollection.findOneAndUpdate(
      { username: userdata.username }, // find a document by username
      { $set: { email: req.body.email } }, // update the email address
      { new: true } // options: return the updated document
    );
    userdata.email=req.body.email;

    if (updatedUser) {
      console.log(`Email updated to ${updatedUser.email} for user ${userdata.username}`);
      res.redirect('/settings?error=updatedemail')
    } else {
      console.log('User not found');
    }
  } catch (error) {
    console.error("An error occurred:", error);
  }
})

app.post('/updateUsername',async(req,res)=>{
  console.log(userdata);
  try {
    const updatedUser = await signupcollection.findOneAndUpdate(
      { email: userdata.email }, // find a document by username
      { $set: { username: req.body.username } }, // update the email address
      { new: true } // options: return the updated document
    );
    userdata.username=req.body.username;

    if (updatedUser) {
      console.log(`Username updated to ${updatedUser.username} for emailid ${userdata.email}`);
      res.redirect('/settings?error=updatedusername')
    } else {
      console.log('User not found');
    }
  } catch (error) {
    console.error("An error occurred:", error);
  }
})


app.post('/updatePassword',async(req,res)=>{
  console.log(userdata);
  try{
    const user = await signupcollection.findOne({ email: userdata.email });
    if (user.password === req.body.oldPassword) 
    {
      user.password = req.body.password;
      await user.save();
      res.redirect('/settings?error=updatedpassword');
    }
    else
    {
      res.redirect('/settings?error=oldpasswordmismatch');
    }
  }
  catch(error)
  {
    console.log(error);
  }
})

app.post('/addExpense', async (req, res) => {
  const { title, amount, paynowNumber } = req.body;

  try {
    // Add the new expense to the BillCollection
    const data = {
      name: username,
      title: title,
      amount: amount,
      paynowNumber: paynowNumber
    };
    await BillCollection.insertMany([data]);

    // Update the spending and paynowNumber for the user who added the expense
    await signupcollection.updateOne(
      { username: username },
      { 
        $inc: { spending: amount },
        $set: { paynowNumber: paynowNumber } 
      }
    );

    // Retrieve all users from the database
    const allUsers = await signupcollection.find();
    const splitAmount = amount / allUsers.length;

    // Prepare for asynchronous operations
    const debtUpdates = allUsers.map(async (otherUser) => {
      if (otherUser.username !== username) {
        // Calculate the new debt amount
        let newDebtAmount = (otherUser.debt?.get(username) || 0) + splitAmount;

        // Update the user's debt map
        const updatedDebt = otherUser.debt || new Map();
        updatedDebt.set(username, newDebtAmount);

        // Persist the updated debt map to the database
        const updatedDebtObject = Object.fromEntries(updatedDebt);
        return signupcollection.updateOne(
          { username: otherUser.username },
          { $set: { debt: updatedDebtObject } }
        );
      }
    });

    // Wait for all debt updates to complete
    await Promise.all(debtUpdates);

    res.json({ message: 'Expense added and debts updated successfully.' });
  } catch (error) {
    console.error('Error adding expense:', error);
    res.status(500).send('Failed to add expense.');
  }
});



app.post('/clearDebt', async (req, res) => {
  const { debtor } = req.body;
  // console.log(debtor);
  try {
    const user = await signupcollection.findOne({ username: username });
    // console.log(user);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // console.log(user.debt);
    // console.log(user.debt.has(debtor));
    // Directly manipulating the object
    if (user.debt.has(debtor)) {
      // console.log(user.debt.get(debtor), "ok");
      const debtorDocument = await signupcollection.findOne({ username: debtor });

      if (!debtorDocument) {
        return res.status(404).json({ message: 'Debtor not found' });
      }

      // console.log("ok");
      const amount = user.debt.get(debtor);
      // console.log(amount);
      const updatedspending=amount+user.spending;
       const updatedspendingfordebtor=debtorDocument.spending-amount;
      //  console.log(updatedspendingfordebtor);
      // Here, you should decrease the spending of the user who is clearing the debt,
      // Not the debtor's spending. Assuming your logic requires updating the spending of the debtor, adjust accordingly.
 
      const updatedDebt = user.debt || new Map();
      updatedDebt.set(debtor, 0);
      // Persist the updated debt map to the database
      const updatedDebtObject = Object.fromEntries(updatedDebt);
      await signupcollection.updateOne(
        { username: user.username },
        {
          $set: { 
            spending: updatedspending,
            debt: updatedDebtObject 
          }
        }
      
      );
      await signupcollection.updateOne(
        { username: debtor },
        { $set: { spending: updatedspendingfordebtor } }
      );
      console.log(await signupcollection.findOne({ username: user }));
      res.json({ message: 'Debt cleared' });
    } else {
      res.status(404).json({ message: 'Debtor not found' });
    }
  } catch (error) {
    console.error('Error clearing debt:', error);
    res.status(500).send('Error clearing debt');
  }
});


app.get('/getSpending', async (req, res) => {
  // Again, assuming 'currentUser' helps identify the current user
  const user = await signupcollection.findOne({ username: username });
  if(user) {
      res.json({ spending: user.spending });
      console.log("spending retrieved")
  } else {
      res.status(404).json({ message: 'User not found' });
  }
});

app.get('/getUserDebts', async (req, res) => {
  const loggedInUsername = userdata.username; // Adjust this according to how you manage sessions or user state.

  if (!loggedInUsername) {
    return res.status(400).send('User is not logged in.');
  }

  try {
    const userData = await signupcollection.findOne({ username: loggedInUsername });
    if (userData) {
      res.json({ debt: userData.debt });
    } else {
      res.status(404).send('User not found');
    }
  } catch (error) {
    console.error('Error fetching user debts:', error);
    res.status(500).send('Internal server error');
  }
});

app.get('/getPayNowNumber', async (req, res) => {
  const { username } = req.query; // Get username from query parameters

  if (!username) {
    return res.status(400).send('Username is required.');
  }

  try {
    const user = await signupcollection.findOne({ username });
    if (user) {
      res.json({ paynowNumber: user.paynowNumber });
    } else {
      res.status(404).send('User not found');
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Internal server error');
  }
});




httpServer.listen(port,() => {
    console.log(`Server is running at port ${port}`);
    //console.log(projectPath);
})