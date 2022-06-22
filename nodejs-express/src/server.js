const express = require("express");
const bodyParser = require("body-parser");

const app = express();
const path = require('path');

const PORT = process.env.PORT || 3000;
const HASURA_BASE_URL = process.env.HASURA_CONSOLE_URL || 'http://localhost:8080/v1/graphql'
const X_HASURA_ADMIN_SECRET = process.env.HASURA_ADMIN_SECRET || '123'
const accountSID = process.env.TWILIO_ACCOUNT_SID || 'ACb5db92822d78c7fc3d35487689671e82';
const authToken = process.env.TWILIO_AUTH_TOKEN || '9eb6d480d1b2f3ddf4328c09355e16ee';

const twilioClient = require('twilio')(accountSID, authToken);

app.use(bodyParser.json());

const fetch = require("node-fetch");

const HASURA_OPERATION = `
mutation insertProduct($productName: String!) {
  insert_products(objects: {product_name: $productName, product_image_path: "/test.jpeg"}) {
    affected_rows
    returning {
      id
      product_image_path
      product_name
    }
  }
}
`;

// execute the parent operation in Hasura
const execute = async (variables) => {
  console.log('variables:', variables);
  const fetchResponse = await fetch(
    `${HASURA_BASE_URL}`,
    {
      method: 'POST',
      headers: {
        'x-hasura-admin-secret': X_HASURA_ADMIN_SECRET
      },
      body: JSON.stringify({
        query: HASURA_OPERATION,
        variables
      })
    }
  );
  const data = await fetchResponse.json();
  console.log('DEBUG: ', data);
  return data;
};
  

// Request Handler
app.post('/insertProduct', async (req, res) => {

  // get request input
  const { productName } = req.body.input;

  // run some business logic

  // execute the Hasura operation
  const { data, errors } = await execute({ productName });

  // if Hasura operation errors, then throw error
  if (errors) {
    return res.status(400).json(errors[0])
  }

  // success
  return res.json({
    ...data.insert_products
  })

});


app.post('/sendSMS', async(req, res) => {
  const {body, from, to} = req.body.input;

  twilioClient.messages
  .create({body, from, to})
  .then(message => {
    console.log(message);
    return res.json({
      response: {
        messageSID: message.sid,
        status: message.status
      }
    })
  })

})

app.get('/hello', async (req, res) => {

  console.log('URL:', HASURA_BASE_URL);
  return res.json({
    hello: "world"
  });
});

app.get('/', async(req, res) => {
  // return res.send(`Hi Deepak, checkout this Hasura cloud <a href="hp-master.hasura.app">hp-master.hasura.app</a>`)
  return res.sendFile(path.join(__dirname+'/index.html'));
})

app.listen(PORT);
