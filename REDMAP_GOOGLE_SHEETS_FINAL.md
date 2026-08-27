# SURYA CIMP — Google Sheets Final Map

Run `setupSuryaSheets()` once. It creates/checks these **16** tabs.

1. **Admissions**  
`Application ID | Student Name | Father Name | Mother Name | Date of Birth | Course | Mobile | Email | Address | Photo URL | Photo Name | Signature URL | Marksheet URL | Aadhaar Uploaded | Aadhaar Mode | Aadhaar Name | Aadhaar Front Name | Aadhaar Back Name | Aadhaar Back Uploaded | Application Date | Status | Aadhaar Front URL | Aadhaar Back URL`

2. **Students**  
`Student ID | Admission ID | Student Name | Father Name | Mother Name | Date of Birth | Mobile | Email | Address | Course | Photo | Signature | Created At | Status`

3. **StudentAuth**  
`Student ID | Password Hash | Salt | Email | OTP Hash | OTP Expires | OTP Attempts | Status | Created At | Updated At`

4. **Courses**  
`Course ID | Course Name | Duration | Fee | Description | Status`

5. **Course Subjects**  
`Course | Subject ID | Subject Name | Max Marks | Pass Marks | Status`

6. **Results**  
`Result ID | Student ID | Student Name | Course | Exam | Total Marks | Obtained Marks | Percentage | Grade | Result | Exam Date | Status`

7. **Result Subjects**  
`Result ID | Student ID | Subject ID | Subject Name | Max Theory Marks | Theory Marks | Max Practical Marks | Practical Marks | Total Max Marks | Obtained Marks | Percentage | Grade | Result | Status`

8. **Certificates**  
`Certificate ID | Student ID | Student Name | Father Name | Course | Total Marks | Obtained Marks | Percentage | Grade | Final Result | Issue Date | Status | Result ID`

9. **MockTests**  
`Test ID | Title | Course | Duration | Total Marks | Description | Status | Created At | Updated At`

10. **MockQuestions**  
`Question ID | Test ID | Question | Option A | Option B | Option C | Option D | Correct Answer | Marks | Status | Created At | Updated At`

11. **MockAttempts**  
`Attempt ID | Test ID | Test Title | Student ID | Student Name | Score | Total Marks | Percentage | Grade | Result | Submitted At`

12. **MockAnswers**  
`Attempt ID | Question ID | Student ID | Question | Selected Answer | Correct Answer | Marks | Awarded Marks`

13. **LiveClasses**  
`Class ID | Title | Course | Teacher | Date | Start Time | End Time | Join URL | Description | Status`

14. **Notices**  
`Notice ID | Title | Message | Category | Status | Priority | Created At | Updated At`

15. **PublicMedia**  
`Media ID | Title | Category | File ID | URL | MIME Type | Size Bytes | Status | Sort Order | Created At | Updated At`

16. **ContactMessages**  
`Message ID | Name | Email | Message | Status | Created At | Handled At`

### Not required
Do **not** create an AdminPassword sheet. Admin credentials are stored in Apps Script Properties.
