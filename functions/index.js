const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');

admin.initializeApp();

// Configure nodemailer with your email service credentials
// For production, use environment variables for sensitive information
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'solacestay.noreply@gmail.com', // Replace with your email
    pass: functions.config().email.password // Set this using Firebase CLI
  }
});

// Cloud Function to send payment receipt via email
exports.sendPaymentReceipt = functions.https.onCall(async (data, context) => {
  try {
    // Verify authentication if needed
    if (!context.auth && !functions.config().email.allowunauthenticated) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated to send emails.'
      );
    }

    // Validate email data
    if (!data.to || !data.subject || !data.receiptData) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Missing required email information'
      );
    }

    // Create email HTML content
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
          }
          .header {
            background-color: #800000;
            color: white;
            padding: 20px;
            text-align: center;
          }
          .content {
            padding: 20px;
          }
          .footer {
            background-color: #f4f4f4;
            padding: 15px;
            text-align: center;
            font-size: 12px;
            color: #666;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
          }
          th {
            background-color: #800000;
            color: white;
          }
          .total-row {
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Solace Stay</h1>
          <p>Payment Receipt</p>
        </div>
        
        <div class="content">
          <h2>Receipt #${data.receiptData.receiptNumber}</h2>
          <p>Date: ${data.receiptData.date}</p>
          
          <h3>Guest Information</h3>
          <p>Name: ${data.receiptData.guestName}</p>
          <p>Email: ${data.receiptData.email}</p>
          
          <h3>Booking Details</h3>
          <p>Room Type: ${data.receiptData.roomType}</p>
          <p>Room Number: ${data.receiptData.roomNumber}</p>
          <p>Check-in: ${data.receiptData.checkInDate}</p>
          <p>Check-out: ${data.receiptData.checkOutDate}</p>
          <p>Guests: ${data.receiptData.guests}</p>
          
          <h3>Payment Summary</h3>
          <table>
            <tr>
              <th>Description</th>
              <th>Amount</th>
            </tr>
            <tr>
              <td>Room Rate</td>
              <td>${data.receiptData.roomRate}</td>
            </tr>
            <tr>
              <td>Room Total (${data.receiptData.nights} nights)</td>
              <td>${data.receiptData.subtotal}</td>
            </tr>
            <tr>
              <td>Taxes (18% GST)</td>
              <td>${data.receiptData.tax}</td>
            </tr>
            <tr class="total-row">
              <td>Total Amount</td>
              <td>${data.receiptData.total}</td>
            </tr>
          </table>
          
          <p>Payment Method: ${data.receiptData.paymentMethod}</p>
          <p>Payment ID: ${data.receiptData.receiptNumber}</p>
          
          <p>Thank you for choosing Solace Stay for your accommodation needs. We hope you enjoy your stay with us!</p>
        </div>
        
        <div class="footer">
          <p>This is an automated email. Please do not reply.</p>
          <p>For any questions or concerns, please contact us at support@solacestay.com</p>
          <p>&copy; ${new Date().getFullYear()} Solace Stay. All rights reserved.</p>
        </div>
      </body>
      </html>
    `;

    // Send email
    const mailOptions = {
      from: '"Solace Stay" <solacestay.noreply@gmail.com>',
      to: data.to,
      subject: data.subject,
      html: htmlContent
    };

    await transporter.sendMail(mailOptions);

    return { success: true, message: 'Receipt email sent successfully' };
  } catch (error) {
    console.error('Error sending email:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// Function to initialize room availability in Firestore
exports.initializeRoomAvailability = functions.https.onRequest(async (req, res) => {
  try {
    const db = admin.firestore();
    const roomTypes = [
      { 
        type: 'Standard Room', 
        prefix: 'S', 
        totalRooms: 30,
        pricePerNight: 3999
      },
      { 
        type: 'Deluxe Room', 
        prefix: 'D', 
        totalRooms: 25,
        pricePerNight: 5999
      },
      { 
        type: 'Master Suite', 
        prefix: 'M', 
        totalRooms: 25,
        pricePerNight: 9999
      },
      { 
        type: 'Honeymoon Suite', 
        prefix: 'H', 
        totalRooms: 20,
        pricePerNight: 12999
      }
    ];

    // Create a batch write
    const batch = db.batch();
    
    // For each room type
    for (const roomType of roomTypes) {
      // Create room type document
      const roomTypeRef = db.collection('roomTypes').doc(roomType.type);
      batch.set(roomTypeRef, {
        name: roomType.type,
        prefix: roomType.prefix,
        totalRooms: roomType.totalRooms,
        pricePerNight: roomType.pricePerNight,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      // Create individual room documents
      for (let i = 1; i <= roomType.totalRooms; i++) {
        const roomNumber = `${roomType.prefix}${i.toString().padStart(3, '0')}`;
        const roomRef = db.collection('rooms').doc(roomNumber);
        batch.set(roomRef, {
          roomNumber: roomNumber,
          roomType: roomType.type,
          isAvailable: true,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }
    }
    
    // Commit the batch
    await batch.commit();
    
    res.status(200).send('Room availability initialized successfully');
  } catch (error) {
    console.error('Error initializing room availability:', error);
    res.status(500).send(`Error initializing room availability: ${error.message}`);
  }
});
