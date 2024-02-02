# PneumoAI
A web applications API that performs image processing using a CNN model and sends the result back to the user.<br />
# Routes and Guidelines
## User Registration
Only done through the O-Auth using Google or Facebook. After Authenticated collect the password, name, age, and blood group from the user and send it to the API route given below.<br />
#### API route(POST request) : https://pneumoai-service.onrender.com/register
##### input JSON format 
{<br />
  userId: "google_id or fb_id"<br />
  name: "name_of_user",<br />
  password: "the_password",<br />
  age: "the_age_integer",<br />
  blood-group: "blood_group"<br />
}
##### output JSON format 
{<br />
  user-created: "True or False",<br />
  existing-user: "True or False"<br />
}<br />
if   user-created=False and existing-user=True then  load the login page<br />
elif user-created=True and existing-user=False then  load the login page<br />
elif user-created=True and existing-user=False then  load the sign-up page<br />
##### output JSON format 
if error becomes <br />
{<br />
  user-created: "True or False",<br />
  existing-user: "True or False",<br />
  error: error.message<br />
}<br />
this will be the output<br />
#### Example
![image](https://github.com/krishna-kpa/PneumoAI/assets/118350087/2a2f2d5f-0109-46df-9de7-1bb511bd03d7)
![image](https://github.com/krishna-kpa/PneumoAI/assets/118350087/bf41977e-a9a9-4924-a22f-d473befc9eeb)

## User Updation
### Update the user's name
#### API route(PUT request) : https://pneumoai-service.onrender.com/users/"the_user_id"/name
##### Input JSON
{<br/>
  "name": "new_name"<br/>
}<br/>
### Update the user's password
#### API route(PUT request) : https://pneumoai-service.onrender.com/users/"the_user_id"/password
##### Input JSON
{<br/>
  "password": "new_password"<br/>
}<br/>
### Update the user's age
#### API route(PUT request) : https://pneumoai-service.onrender.com/users/"the_user_id"/age
##### Input JSON
{<br/>
  "age": "new_age"<br/>
}<br/>
### Update the user's bloodgroup
#### API route(PUT request) : https://pneumoai-service.onrender.com/users/"the_user_id"/bloodgroup
##### Input JSON
{<br/>
  "bloodgroup": "new_bloodgroup"<br/>
}<br/>
#### Example
![image](https://github.com/krishna-kpa/PneumoAI/assets/118350087/8ffa0b96-34d2-49e4-820c-33ad5cdc4c40)

## User Login


