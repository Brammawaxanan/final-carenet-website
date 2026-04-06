import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Container,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Box,
  Divider,
} from '@mui/material';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import './Payment.css';
import Header from '../../components/Header/Header';
import axios from 'axios';

const PaymentPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const booking = location.state?.booking;

  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');

  const handlePayment = async () => {
  if (!cardNumber || !cardName || !expiry || !cvv) {
    alert('Please fill all payment details.');
    return;
  }

  if (!booking) {
    alert('No booking info found!');
    return;
  }

  const paymentRequest = {
    booking: { bookingID: booking.bookingID }, // make sure your booking has bookingID
    cardNumber,
    cardName,
    expiry,
    cvv,
    amount: booking.totalCost,
  };

  try {
    const response = await axios.post(
      'http://localhost:8081/api/payments', // your BE payment endpoint
      paymentRequest
    );

    console.log('Payment response:', response.data);
    alert('Payment successful! 🎉');
    navigate('/confirmation', { state: { booking } });
  } catch (error: any) {
    console.error('Payment error:', error.response || error.message);
    alert(
      `Something went wrong while processing payment: ${
        error.response?.data?.message || error.message
      }`
    );
  }
};

  return (
    <>
      <Header />
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Card
          sx={{
            mb: 4,
            border: '1px solid',
            borderColor: 'grey.200',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            borderRadius: 2,
            backgroundColor: 'background.paper',
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Typography
              variant="h5"
              color="primary.main"
              sx={{ mb: 3, fontWeight: 'bold', letterSpacing: 0.5 }}
            >
              Payment Summary
            </Typography>
            <Box
              display="flex"
              alignItems="center"
              gap={2}
              sx={{
                mb: 3,
                p: 2,
                backgroundColor: 'grey.50',
                borderRadius: 1,
              }}
            >
              <AttachMoneyIcon sx={{ color: '#4caf50 !important', fontSize: 30 }} />
              <Typography
                variant="h5"
                sx={{ fontWeight: 'bold', color: 'primary.dark' }}
              >
                Total  :  ${booking?.totalCost || 0}
              </Typography>
            </Box>
            <Divider sx={{ my: 2, borderColor: 'grey.300' }} />
            <Box sx={{ display: 'grid', gap: 1.5 }}>
              <Box display="flex" justifyContent="space-between">
                <Typography
                  variant="body1"
                  sx={{ color: 'text.secondary', fontWeight: 'medium' }}
                >
                  Caregiver:
                </Typography>
                <Typography variant="body1">
                  {booking?.caregiverId || '-'}
                </Typography>
              </Box>
              <Box display="flex" justifyContent="space-between">
                <Typography
                  variant="body1"
                  sx={{ color: 'text.secondary', fontWeight: 'medium' }}
                >
                  Date:
                </Typography>
                <Typography variant="body1">{booking?.date || '-'}</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between">
                <Typography
                  variant="body1"
                  sx={{ color: 'text.secondary', fontWeight: 'medium' }}
                >
                  Time Slot:
                </Typography>
                <Typography variant="body1">{booking?.slot || '-'}</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between">
                <Typography
                  variant="body1"
                  sx={{ color: 'text.secondary', fontWeight: 'medium' }}
                >
                  Duration:
                </Typography>
                <Typography variant="body1">
                  {booking?.duration || '-'} hrs
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="h5" color="primary" mb={3}>
              Enter Payment Details
            </Typography>

            <TextField
              label="Card Number"
              fullWidth
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value)}
              margin="normal"
              InputProps={{
                startAdornment: <CreditCardIcon />,
              }}
            />

            <TextField
              label="Name on Card"
              fullWidth
              value={cardName}
              onChange={(e) => setCardName(e.target.value)}
              margin="normal"
            />

            <Box display="flex" gap={2}>
              <TextField
                label="Expiry (MM/YY)"
                fullWidth
                value={expiry}
                onChange={(e) => setExpiry(e.target.value)}
                margin="normal"
              />
              <TextField
                label="CVV"
                fullWidth
                value={cvv}
                onChange={(e) => setCvv(e.target.value)}
                margin="normal"
              />
            </Box>

            <Button
              variant="contained"
              color="primary"
              size="large"
              fullWidth
              sx={{ mt: 3 }}
              onClick={handlePayment}
            >
              Pay ${booking?.totalCost || 0}
            </Button>
          </CardContent>
        </Card>
      </Container>
    </>
  );
};

export default PaymentPage;