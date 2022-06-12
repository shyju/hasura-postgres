const express = require("express");
const bodyParser = require("body-parser");

const app = express();

const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

const fetch = require("node-fetch")

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
  const fetchResponse = await fetch(
    "http://localhost:8080/v1/graphql",
    {
      method: 'POST',
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

app.get('/hello', async (req, res) => {
  return res.json({
    hello: "world"
  });
});

app.listen(PORT);
