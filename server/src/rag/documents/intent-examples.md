# Skill-Link Intent Classification Dataset

Lexi classifies user utterances into one of 14 core intents to determine whether to converse naturally, provide platform knowledge, or trigger backend service tools.

## 1. `conversation`
Casual small talk, greetings, gratitude, jokes, check-ins.
* "hi", "hello", "kaise ho", "kya haal hai", "mai bhi thik hu", "sab badhiya", "aur batao", "tell me a joke", "thanks", "my brother is an electrician".
* **Action**: Converse naturally without searching workers.

## 2. `skill_link_question`
Inquiries about Skill-Link platform mechanics, guarantees, or future roadmap.
* "What is Skill-Link?", "How does Skill-Link work?", "Skill-Link ka future kya hai?", "What is the visit fee?".
* **Action**: Retrieve factual context from RAG knowledge base.

## 3. `service_request`
User states a real-world problem or indicates need for skilled assistance.
* "mere bike kharab ho gayi hai mujhe worker chahiye", "mujhe plumber chahiye", "switchboard se spark aa raha", "AC cooling nahi kar raha".
* **Action**: Identify service, check location, trigger `searchWorkers` tool.

## 4. `worker_search`
Explicit request to browse nearby technicians.
* "mere paas koi electrician available hai?", "Sector 17 mein mechanics dhoondo".
* **Action**: Invoke `searchWorkers(category, location)`.

## 5. `worker_details`
Request for a worker's full profile and price estimate.
* "Raj ke baare mein batao", "How much does Ramanand mechanic charge?".
* **Action**: Invoke `getWorkerDetails(workerId)`.

## 6. `availability_check`
Checking real-time slot or online availability.
* "Raj kal subah available hai?", "Is the plumber available right now?".
* **Action**: Invoke `checkWorkerAvailability(workerId, timeSlot)`.

## 7. `booking_request`
User indicates choice of technician.
* "Raj ko book karna hai", "I want to book Vikram plumber".
* **Action**: Display transparent price breakdown and ask for final confirmation.

## 8. `booking_confirmation`
Explicit affirmative confirmation to book.
* "haan book kar do", "yes confirm booking", "theek hai book kardo".
* **Action**: Invoke `createBooking()`.

## 9. `booking_status`
Checking dispatch progress and ETA.
* "meri booking ka kya hua?", "where is my technician?", "status of #BK-1001".
* **Action**: Invoke `getBookingStatus(bookingId)`.

## 10. `booking_cancellation`
Cancelling an active booking.
* "booking cancel karni hai", "cancel order BK-1001", "technician mat bhejo".
* **Action**: Invoke `cancelBooking(bookingId)`.

## 11. `emergency_service`
Critical dangerous breakdowns or floodings.
* "car highway par band ho gayi", "short circuit se aag lagne ka khatra hai", "pipe burst ho gaya ghar me paani bhar raha".
* **Action**: Prioritize 15-20 min dispatch and display 24/7 verified helplines.
