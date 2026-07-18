const http = require('http');
const fs = require('fs');

const postData = JSON.stringify({
  personalInfo: {
    name: "Ammar Masoud",
    email: "masoudammar10@gmail.com",
    phone: "0700000000",
    location: "Jordan",
    website: "ammar.dev"
  },
  summary: "Software engineer specializing in backend systems.",
  skills: [{ category: "Languages", items: ["JavaScript", "Python"] }],
  experience: [{
    company: "DevCo",
    role: "Software Engineer",
    startDate: "2023",
    endDate: "Present",
    description: ["Wrote solid backend services."]
  }],
  education: [{
    institution: "Hashemite University",
    degree: "B.Sc. Computer Science",
    startDate: "2020",
    endDate: "2024"
  }]
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/pdf',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
  
  if (!fs.existsSync('tmp')) {
    fs.mkdirSync('tmp');
  }
  const fileStream = fs.createWriteStream('tmp/test_client.pdf');
  res.pipe(fileStream);

  fileStream.on('finish', () => {
    fileStream.close();
    console.log('PDF saved to tmp/test_client.pdf');
    
    // Read first 10 bytes to verify magic header
    const fd = fs.openSync('tmp/test_client.pdf', 'r');
    const buffer = Buffer.alloc(10);
    fs.readSync(fd, buffer, 0, 10, 0);
    fs.closeSync(fd);
    console.log(`First 10 bytes: ${buffer.toString()}`);
    console.log(`Hex bytes: ${buffer.toString('hex')}`);
  });
});

req.on('error', (e) => {
  console.error(`problem with request: ${e.message}`);
});

// Write data to request body
req.write(postData);
req.end();
