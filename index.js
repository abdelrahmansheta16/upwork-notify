const Parser = require('rss-parser');
const nodemailer = require('nodemailer');
require('dotenv').config()


// RSS feed URL to monitor (update this with your feed URL)
const rssFeedUrl = 'https://www.upwork.com/ab/feed/topics/rss?securityToken=c19138317f5828ce24b314bbd6e751eb0cfd030ea469df41e509c0c44a392d48476ac0781460cc3f6b92669181b845df147212754c010f7463d8a0217fc4810c&userUid=1656950490244976640&orgUid=1656950490244976641&topic=6873750';

// Email configuration (using Gmail as an example)
const emailConfig = {
    service: 'Gmail',
    auth: {
        user: process.env.USER,
        pass: process.env.PASS,
    },
    from: process.env.USER,
    to: 'abdelrahmansheta16@example.com',
    subject: 'New Upwork Job Posting',
};

// Initialize the RSS parser
const parser = new Parser();

// Initialize the email transporter
const transporter = nodemailer.createTransport(emailConfig);

// Keep track of the latest job post's publication date
let latestJobDate = null;

// Function to send an email notification
function sendEmailNotification(title, link) {
    const mailOptions = {
        ...emailConfig,
        text: `New job posting: ${title}\n${link}`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error sending email:', error);
        } else {
            console.log('Email notification sent:', info.response);
        }
    });
}

// Function to check for new job postings
async function checkForNewJobs() {
    try {
        const feed = await parser.parseURL(rssFeedUrl);

        if (feed.items.length === 0) {
            console.log('No job postings found in the feed.');
            return;
        }

        // Iterate through the feed items in reverse order (most recent first)
        for (let i = feed.items.length - 1; i >= 0; i--) {
            const item = feed.items[i];
            const itemDate = new Date(item.pubDate);

            // Check if the current job posting is newer than the latest known job
            if (latestJobDate === null || itemDate > latestJobDate) {
                console.log('New job posting detected:', item.title);
                sendEmailNotification(item.title, item.link);

                // Update the latest known job date
                latestJobDate = itemDate;
            } else {
                // If we encounter an older job posting, we can stop checking
                break;
            }
        }
    } catch (error) {
        console.error('Error parsing RSS feed:', error);
    }
}

// Check for new job postings periodically (e.g., every 1 hour)
setInterval(checkForNewJobs, 60 * 1000);
