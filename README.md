# PneumoAI
A web applications API that performs image processing using a CNN model and sends the result back to the user.
# Routes and Guidelines
## User Registration
Only done through the O-Auth using Google or Facebook. After Authenticated collect the password, name, age, and blood group from the user and send it to the API route given below.
##### input JSON format 
{
  userId: "google_id or fb_id"
  name: "name_of_user",
  password: "the_password",
  age: "the_age_integer",
  blood-group: "blood_group"
}
##### output JSON format 
{
  user-created: "True or False",
  existing-user: "True or False"
}
if   user-created=False and existing-user=True then  load the login page
elif user-created=True and existing-user=False then  load the login page
elif user-created=True and existing-user=False then  load the sign-up page
if error becomes 
{
  user-created: "True or False",
  existing-user: "True or False",
  error: error.message
}
this will be the output
#### API route : https://pneumoai-service.onrender.com/register
