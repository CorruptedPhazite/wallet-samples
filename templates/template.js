/*
 * Copyright 2022 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

async function main() {

  // [START setup]
  // [START imports]
  const { GoogleAuth } = require('google-auth-library');
  const jwt = require('jsonwebtoken');
  // [END imports]

  /*
   * keyFilePath - Path to service account key file from Google Cloud Console
   *             - Environment variable: GOOGLE_APPLICATION_CREDENTIALS
   */
  const keyFilePath = process.env.GOOGLE_APPLICATION_CREDENTIALS || '/path/to/key.json';

  /*
   * issuerId - The issuer ID being updated in this request
   *          - Environment variable: WALLET_ISSUER_ID
   */
  const issuerId = process.env.WALLET_ISSUER_ID || 'issuer-id';

  /*
   * classId - Developer-defined ID for the wallet class
   *         - Environment variable: WALLET_CLASS_ID
   */
  const classId = process.env.WALLET_CLASS_ID || 'test-$object_type-class-id';

  /*
   * userId - Developer-defined ID for the user, such as an email address
   *        - Environment variable: WALLET_USER_ID
   */
  const userId = process.env.WALLET_USER_ID || 'user-id';

  /*
   * objectId - ID for the wallet object
   *          - Format: `issuerId.userId`
   *          - Should only include alphanumeric characters, '.', '_', or '-'
   */
  const objectId = `${issuerId}.${userId.replace(/[^\w.-]/g, '_')}-${classId}`;
  // [END setup]

  ///////////////////////////////////////////////////////////////////////////////
  // Create authenticated HTTP client, using service account file.
  ///////////////////////////////////////////////////////////////////////////////

  // [START auth]
  const credentials = require(keyFilePath);

  const httpClient = new GoogleAuth({
    credentials: credentials,
    scopes: 'https://www.googleapis.com/auth/wallet_object.issuer'
  });
  // [END auth]

  ///////////////////////////////////////////////////////////////////////////////
  // Create a class via the API (this can also be done in the business console).
  ///////////////////////////////////////////////////////////////////////////////

  // [START class]
  const classUrl = 'https://walletobjects.googleapis.com/walletobjects/v1/$object_typeClass/';
  const classPayload = $class_payload;

  let classResponse = await httpClient.request({
    url: classUrl,
    method: 'POST',
    data: classPayload
  });

  console.log('class POST response: ', classResponse);
  // [END class]

  ///////////////////////////////////////////////////////////////////////////////
  // Get or create an object via the API.
  ///////////////////////////////////////////////////////////////////////////////

  // [START object]
  const objectUrl = 'https://walletobjects.googleapis.com/walletobjects/v1/$object_typeObject/';
  const objectPayload = $object_payload;

  let objectResponse;
  try {
    objectResponse = await httpClient.request({
      url: objectUrl + objectId,
      method: 'GET'
    });
  } catch (err) {
    if (err.response && err.response.status === 404) {
      // Object does not yet exist
      // Send POST request to create it
      objectResponse = await httpClient.request({
        url: objectUrl,
        method: 'POST',
        data: objectPayload
      });
    } else {
      objectResponse = err;
    }
  }

  console.log('object GET or POST response:', objectResponse);
  // [END object]

  ///////////////////////////////////////////////////////////////////////////////
  // Create a JWT for the object, and encode it to create a "Save" URL.
  ///////////////////////////////////////////////////////////////////////////////

  // [START jwt]
  const claims = {
    iss: credentials.client_email,
    aud: 'google',
    origins: ['www.example.com'],
    typ: 'savetowallet',
    payload: {
      $object_typeObjects: [{
        id: $object_id
      }],
    }
  };

  const token = jwt.sign(claims, credentials.private_key, { algorithm: 'RS256' });
  const saveUrl = `https://pay.google.com/gp/v/save/${token}`;

  console.log(saveUrl);
  // [END jwt]

  ///////////////////////////////////////////////////////////////////////////////
  // Create a new Google Wallet issuer account
  ///////////////////////////////////////////////////////////////////////////////

  // [START createIssuer]
  // New issuer name
  const issuerName = "name";

  // New issuer email address
  const issuerEmail = "email-address";

  // Issuer API endpoint
  const issuerUrl = "https://walletobjects.googleapis.com/walletobjects/v1/issuer";

  // New issuer information
  let issuerPayload = {
    name: issuerName,
    contactInfo: {
      email: issuerEmail
    }
  };

  let issuerResponse = await httpClient.request({
    url: issuerUrl,
    method: 'POST',
    data: issuerPayload
  });

  console.log('issuer POST response:', issuerResponse);
  // [END createIssuer]

  ///////////////////////////////////////////////////////////////////////////////
  // Update permissions for an existing Google Wallet issuer account
  ///////////////////////////////////////////////////////////////////////////////

  // [START updatePermissions]
  // Permissions API endpoint
  permissionsUrl = `https://walletobjects.googleapis.com/walletobjects/v1/permissions/${issuerId}`;

  // New issuer permissions information
  permissionsPayload = {
    issuerId: issuerId,
    permissions: [
      // Copy as needed for each email address that will need access
      {
        emailAddress: "email-address",
        role: "READER | WRITER | OWNER"
      }
    ]
  };

  let permissionsResponse = await httpClient.request({
    url: permissionsUrl,
    method: 'PUT',
    data: permissionsPayload
  });

  console.log('permissions PUT response:', permissionsResponse);
  // [END updatePermissions]
};
