package com.moviebuff.moviebuff_backend.service.Email;

import org.springframework.beans.factory.annotation.*;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

// EmailService.java
@Service
public class EmailService {
    @Autowired
    private JavaMailSender mailSender;

    public void sendCredentialsMail(String to, String username, String password) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject("Theater Manager Account Credentials");
        message.setText(String.format(
            "Hello %s,\n\n" +
            "Your theater manager account has been created successfully.\n" +
            "Please use the following credentials to login:\n\n" +
            "Username: %s\n" +
            "Password: %s\n\n" +
            "Please change your password after your first login.\n\n" +
            "Best regards,\n" +
            "MovieBuff Team",
            username, username, password
        ));
        
        mailSender.send(message);

        System.out.println("Mail Sent Successfully");
    }
}



