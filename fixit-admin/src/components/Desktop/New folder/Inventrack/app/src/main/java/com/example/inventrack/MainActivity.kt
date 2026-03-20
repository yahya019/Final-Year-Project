package com.example.inventrack

import android.content.Intent
import android.os.Bundle
import android.util.Patterns
import android.widget.Button
import android.widget.EditText
import android.widget.TextView
import android.widget.Toast
import androidx.activity.enableEdgeToEdge
import androidx.appcompat.app.AppCompatActivity

class MainActivity : AppCompatActivity() {

    private lateinit var db: DBHelper

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContentView(R.layout.activity_main)

        db = DBHelper(this) // Database helper

        val usernameInput = findViewById<EditText>(R.id.usernameInput)
        val passwordInput = findViewById<EditText>(R.id.passwordInput)
        val loginButton = findViewById<Button>(R.id.loginButton)
        val signupLink = findViewById<TextView>(R.id.signup2)

        loginButton.setOnClickListener {
            val username = usernameInput.text.toString().trim()
            val password = passwordInput.text.toString()

            // Validation: Username
            if (username.isEmpty()) {
                usernameInput.error = "Please enter your username or email"
                return@setOnClickListener
            }

            // Validation: If input contains '@', assume it's an email and check format
            if (username.contains("@") && !Patterns.EMAIL_ADDRESS.matcher(username).matches()) {
                usernameInput.error = "Please enter a valid email address"
                return@setOnClickListener
            }

            // Validation: Password
            if (password.isEmpty()) {
                passwordInput.error = "Please enter your password"
                return@setOnClickListener
            }

            if (password.length < 6) {
                passwordInput.error = "Password must be at least 6 characters long"
                return@setOnClickListener
            }

            // Check in SQLite DB
            val isValid = db.checkUser(username, password)
            if (isValid) {
                Toast.makeText(this, "Login Successful", Toast.LENGTH_SHORT).show()
                //Redirect to Dashboard or Home
                 startActivity(Intent(this, dashboard::class.java))
                 finish()
            } else {
                Toast.makeText(this, "Invalid Username or Password", Toast.LENGTH_SHORT).show()
            }
        }

        // Handle Sign Up Click
        signupLink.setOnClickListener {
            val intent = Intent(this, signup::class.java)
            startActivity(intent)
        }
    }
}
