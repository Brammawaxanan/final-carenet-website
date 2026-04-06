// src/pages/BookingPage.tsx
import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Container,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Box,
  Avatar,
} from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import PersonIcon from "@mui/icons-material/Person";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import dayjs, { Dayjs } from "dayjs";
import "./Booking.css";
import Header from "../../components/Header/Header";
import ApiService from "../../services/api";

import maleNurseImage from "../../assets/male nurse.webp";

const BookingPage: React.FC = () => {
  const mockCaregiver = {
    caregiverId: 123,
    name: "Jane Doe",
    type: "Nurse",
    hourlyRate: 25,
    location: "New York, NY",
    availability: [
      { date: "2025-10-01", slots: ["09:00-12:00", "14:00-17:00"] },
      { date: "2025-10-02", slots: ["10:00-13:00"] },
    ],
    profileSummary: "Certified nurse with 5 years of experience.",
    profileImage: maleNurseImage,
  };

  const location = useLocation();
  const caregiver = location.state?.caregiver || mockCaregiver;
  const navigate = useNavigate();

  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [duration, setDuration] = useState(1);
  const [instructions, setInstructions] = useState("");

  const availableDates = caregiver.availability.map(
    (a: { date: string | number | dayjs.Dayjs | Date | null | undefined }) =>
      dayjs(a.date)
  );

  const shouldDisableDate = (date: Dayjs) => {
    return !availableDates.some(
      (avail: { isSame: (arg0: dayjs.Dayjs, arg1: string) => any }) =>
        avail.isSame(date, "day")
    );
  };

  const getSlotsForDate = (date: Dayjs | null) => {
    if (!date) return [];
    const formattedDate = date.format("YYYY-MM-DD");
    return (
      caregiver.availability.find(
        (a: { date: string }) => a.date === formattedDate
      )?.slots || []
    );
  };

  const totalCost = caregiver.hourlyRate * duration;

  // inside BookingPage
const handleConfirm = async () => {
  if (!selectedDate || !selectedSlot || !duration) {
    alert("Please select a date, time slot, and duration.");
    return;
  }

  // Parse the time slot to get hours
  const [startTime] = selectedSlot.split("-");
  const bookingDate = selectedDate.format("YYYY-MM-DD");
  const startDateTime = new Date(`${bookingDate}T${startTime}:00`);
  
  // Calculate end date based on duration (in hours)
  const endDateTime = new Date(startDateTime);
  endDateTime.setHours(endDateTime.getHours() + duration);

  const bookingData = {
    caregiverId: caregiver.id || caregiver.caregiverId,
    serviceRequestId: null, // Optional
    startDate: startDateTime.toISOString(),
    endDate: endDateTime.toISOString(),
    serviceType: caregiver.type || "General Care",
    taskDescription: instructions || "Scheduled care service"
  };

  try {
    console.log("Creating booking:", bookingData);
    const response = await ApiService.createBooking(bookingData);
    console.log("Booking created:", response);

    // Navigate with saved booking info (assignment + task)
    navigate("/payment", { 
      state: { 
        booking: response,
        caregiver: caregiver,
        totalCost: totalCost
      } 
    });
  } catch (error) {
    console.error("Error creating booking:", error);
    alert("Something went wrong while booking ❌\nPlease try again.");
  }
};

  return (
    <>
      <Header />
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <Box
          sx={{
            mt:5,
            background: "linear-gradient(135deg, #1976d2 0%, #4a90e2 100%)",
            color: "white",
            padding: "2rem",
            borderRadius: "12px 12px 0 0",
            textAlign: "center",
            mb: 2,
          }}
        >
          <Typography variant="h3" fontWeight="bold">
            Book Your Care with {caregiver.name}
          </Typography>
          <Typography variant="subtitle1">
            Professional {caregiver.type} in {caregiver.location}
          </Typography>
        </Box>
        <Container maxWidth="md" sx={{ py: 4 }}>
          {/* Profile Card */}
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Avatar
                  src={caregiver.profileImage}
                  alt={caregiver.name}
                  sx={{ width: 80, height: 80, mr: 2 }}
                />
                <Box>
                  <Typography variant="h4" color="primary">
                    {caregiver.name}
                  </Typography>
                  <Typography variant="subtitle1" color="textSecondary">
                    <PersonIcon fontSize="small" /> {caregiver.type}
                  </Typography>
                  <Typography variant="body1">
                    <LocationOnIcon fontSize="small" /> {caregiver.location}
                  </Typography>
                  <Typography variant="body1">
                    <AttachMoneyIcon fontSize="small" /> ${caregiver.hourlyRate}
                    /hr
                  </Typography>
                  <Typography variant="body2" mt={1}>
                    {caregiver.profileSummary}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          <Box display="flex" flexDirection="column" gap={3}>
            <Typography variant="h5" color="primary">
              Select Date and Time
            </Typography>

            <DatePicker
              label="Select a Date"
              value={selectedDate}
              onChange={(newValue) => {
                setSelectedDate(newValue);
                setSelectedSlot("");
              }}
              shouldDisableDate={shouldDisableDate}
            />

            <FormControl fullWidth disabled={!selectedDate}>
              <InputLabel id="slot-label">Select Time Slot</InputLabel>
              <Select
                labelId="slot-label"
                value={selectedSlot}
                label="Select Time Slot"
                onChange={(e) => setSelectedSlot(e.target.value)}
              >
                {getSlotsForDate(selectedDate).map((slot: string) => (
                  <MenuItem key={slot} value={slot}>
                    {slot}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Typography variant="h5" color="primary">
              Service Details
            </Typography>

            <TextField
              label="Duration (hours)"
              type="number"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              fullWidth
              inputProps={{ min: 1 }}
            />

            <TextField
              label="Special Instructions"
              multiline
              rows={4}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              fullWidth
            />

            <Typography variant="h6" color="secondary" align="right">
              Total Cost: ${totalCost}
            </Typography>

            <Button
              variant="contained"
              color="primary"
              size="large"
              fullWidth
              onClick={handleConfirm}
            >
              Confirm and Pay
            </Button>
          </Box>
        </Container>
      </LocalizationProvider>
    </>
  );
};

export default BookingPage;
