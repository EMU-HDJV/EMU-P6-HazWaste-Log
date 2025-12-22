let data = [];
let currentUserEmail = "";

// REPLACE with your NEW Google Web App URL from Deployment
const scriptURL = "https://script.google.com/macros/s/AKfycbxvMZMC6KIwHHtkgpLoQZbGrgRkPzCVFArTXV3-S9jQaO32cSEX5UzDTnHeAuCNbk2QDg/exec";

// --- 1. INITIALIZE LOGIN ---
window.onload = function () {
  google.accounts.id.initialize({
    client_id: "648943267004-cgsr4bhegtmma2jmlsekjtt494j8cl7f.apps.googleusercontent.com",
    callback: handleCredentialResponse
  });

  google.accounts.id.renderButton(
    document.getElementById("buttonDiv"),
    { theme: "outline", size: "large", width: "250" } 
  );
};

// --- 2. GOOGLE LOGIN HANDLER ---
function handleCredentialResponse(response) {
  const responsePayload = parseJwt(response.credential);
  const loggedInEmail = responsePayload.email.toLowerCase();
  
  const authorizedUsers = [
    "efrancisalbert@gmail.com", 
    "francisalbertespina@gmail.com", 
    "sanpabloshan@gmail.com",
    "hdjvemu2026@gmail.com"
  ];
  
  if (authorizedUsers.includes(loggedInEmail)) {
    currentUserEmail = loggedInEmail;
    document.getElementById("login-section").style.display = "none";
    document.getElementById("form-section").style.display = "block";
    
    const statusText = document.getElementById("status");
    statusText.innerText = "Welcome, " + responsePayload.name;
    statusText.style.color = "#2e7d32";
  } else {
    alert("Access Denied for: " + loggedInEmail);
  }
}

function parseJwt(token) {
  var base64Url = token.split('.')[1];
  var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  var jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
  }).join(''));
  return JSON.parse(jsonPayload);
}

// --- 3. PHOTO PREVIEW ---
function previewImage(event) {
  if (event.target.files && event.target.files[0]) {
    const reader = new FileReader();
    reader.onload = function() {
      const output = document.getElementById('outputPreview');
      const container = document.getElementById('imagePreviewContainer');
      output.src = reader.result;
      container.style.display = 'block';
    }
    reader.readAsDataURL(event.target.files[0]);
  }
}

// --- 4. DATA ENTRY HANDLER ---
async function addEntry() {
  const fileInput = document.getElementById("photo");
  const statusText = document.getElementById("status");
  const date = document.getElementById("date").value;
  const volume = document.getElementById("volume").value;
  const waste = document.getElementById("waste").value;
  
  const file = fileInput.files[0];
  let fileData = null;

  if (!date || !volume || !waste) {
    alert("Please complete all fields");
    return;
  }

  statusText.innerText = "Processing entry...";
  statusText.style.color = "#1976d2";

  if (file) {
    fileData = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result.split(",")[1]);
      reader.readAsDataURL(file);
    });
  }

  const rowData = {
    date: date,
    volume: volume,
    waste: waste,
    userEmail: currentUserEmail,
    imageByte: fileData, 
    imageName: file ? `Waste_${Date.now()}.png` : null
  };

  statusText.innerText = "Syncing with Cloud...";

  fetch(scriptURL, {
    method: 'POST',
    mode: 'no-cors', 
    cache: 'no-cache',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(rowData)
  })
  .then(() => {
    statusText.innerText = "✅ Saved successfully!";
    statusText.style.color = "#2e7d32";
    
    // Update local table UI
    data.push(rowData);
    const tbody = document.querySelector("#table tbody");
    const row = tbody.insertRow(0);
    row.insertCell(0).innerText = date;
    row.insertCell(1).innerText = volume;
    row.insertCell(2).innerText = waste;

    // Reset fields
    document.getElementById("volume").value = "";
    document.getElementById("waste").value = "";
    document.getElementById("photo").value = "";
    document.getElementById("imagePreviewContainer").style.display = "none";
  })
  .catch(error => {
    statusText.innerText = "❌ Error uploading";
    console.error(error);
  });
}

// --- 5. EXPORT HANDLER ---
function exportExcel() {
  if (data.length === 0) {
    alert("No data in current session!");
    return;
  }
  let csv = "Date,Volume (kg),Waste Name,Logged By\n";
  data.forEach(row => {
    csv += `"${row.date}","${row.volume}","${row.waste}","${row.userEmail}"\n`;
  });
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `waste_log_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

