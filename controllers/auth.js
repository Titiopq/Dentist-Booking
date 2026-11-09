const User = require('../models/User');

//@desc Register user
//@route POST /api/vl/auth/register
//@access Public

exports.register=async (req, res, next)=>{
    try{
        const {name, telephone, email, password}=req.body;
        if (!name || !telephone || !email || !password) {
            return res.status(400).json({success:false, error:'Please provide name, telephone, email, and password'});
        }

        //Create user
        const user=await User.create({
            name,
            telephone,
            email,
            password
        });

        sendTokenResponse(user, 201, res);
    } catch(err){
        const status = err.code === 11000 ? 409 : 400;
        res.status(status).json({success:false, error:err.message});
    }
}

//@desc Login user
//@route POST /api/v1/auth/login
//@access Public
exports.login=async (req, res, next)=>{
    try{

    const {email, password}=req.body;

    //Validate email & password
    if(!email || !password){
        return res.status(400).json({success:false, error:'Please provide an email and password'});
    }

    //Check for user
    const normalizedEmail = String(email).trim().toLowerCase();
    const user=await User.findOne({email:normalizedEmail}).select('+password +tokenVersion');

    if(!user){
        return res.status(400).json({success:false, error:'Invalid credentials'});
    }

    //Check if password matches
    const isMatch=await user.matchPassword(password);

    if(!isMatch){
        return res.status(401).json({success:false, error:'Invalid credentials'});
    }

    sendTokenResponse(user, 200, res);

    } catch(err){
        res.status(401).json({success:false, msg:'Cannot convert email or password to string'}); 
    }
}

//@desc Log user out / clear cookie
//@route GET /api/v1/auth/logout
//@access Private
exports.logout=async(req,res,next)=>{
    try {
        await User.updateOne({ _id: req.user.id }, { $inc: { tokenVersion: 1 } });
        res.clearCookie('token', {
            httpOnly:true,
            secure:process.env.NODE_ENV === 'production',
            sameSite:'lax'
        });
        res.status(200).json({ success:true, data:{} });
    } catch (err) {
        res.status(500).json({ success:false, error:'Cannot log out' });
    }
};

//Get token from model, create cookie and send response
const sendTokenResponse=(user, statusCode, res)=>{
    //Create token
    const token=user.getSignedJwtToken();

    const options={
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000),
        httpOnly:true,
        sameSite:'lax'
    }

    if(process.env.NODE_ENV==='production'){
        options.secure=true;
    }

    res.status(statusCode).cookie('token', token, options).json({
        success:true,
        //add for frontend
        _id:user._id,
        name: user.name,
        email:user.email,
        telephone:user.telephone,
        role:user.role,
        //end for frontend
        token
    })
}

//@desc     Get current Logged in user
//@route    POST /api/vl/auth/me
//@access   Private
exports.getMe=async (req, res, next)=>{
    const user=await User.findById(req.user.id);
    res.status(200).json({
        success:true,
        data:user
    })
}
