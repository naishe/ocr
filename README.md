# 👓 SIMPLE OCR VERIFIER 👓

### CAN BE EASILY DUPED IF YOU FORGE THE IMAGE ITSELF 😂

This is a proof of concept that is supposed to do the following:

1. You select image of a document (for example a passbook that has your account number, name and date of birth)
2. You fill up the form fields with the values manually
3. To validate select the area which contain these values and then click validate for each fields. so, you select the account number in the image, then click "verify" button next to the form field labeled as "Account Number".
4. This will trigger a verification process where the optical character recognition library reads the cropped image, and its output is compared with the field you clicked "verify" for. You will see an alert depending on whether the text matches the image or not.

Demo: [https://demo.naishe.in](https://demo.naishe.in)
