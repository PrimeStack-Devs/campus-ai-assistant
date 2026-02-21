export function renderHTML(data) {
  const styles = `
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f4f6f9;
      font-family: Arial, Helvetica, sans-serif;
    }

    .container-wrapper {
      padding: 40px 20px;
    }

    .container {
      max-width: 900px;
      margin: 0 auto;
      background: #ffffff;
      padding: 30px;
      border-radius: 10px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    h1 {
      text-align: center;
      color: #1a237e;
      margin-bottom: 30px;
      font-size: 26px;
    }

    h2 {
      color: #283593;
      margin-top: 30px;
      margin-bottom: 15px;
      font-size: 20px;
    }

    p {
      line-height: 1.6;
      margin-bottom: 14px;
      color: #444;
      font-size: 15px;
    }

    ol {
      padding-left: 20px;
    }

    li {
      margin-bottom: 15px;
      line-height: 1.6;
      font-size: 15px;
    }

    a {
      color: #1565c0;
      text-decoration: none;
      font-weight: bold;
    }

    a:hover {
      text-decoration: underline;
    }

    .info-box {
      background-color: #e8eaf6;
      padding: 20px;
      border-left: 5px solid #3949ab;
      border-radius: 5px;
      margin-top: 20px;
    }

    .highlight {
      font-weight: bold;
      color: #d32f2f;
    }

    .footer {
      text-align: center;
      margin-top: 30px;
      font-size: 14px;
      color: #555;
    }

    .badge {
      display: inline-block;
      background-color: #3949ab;
      color: #ffffff;
      padding: 5px 12px;
      font-size: 12px;
      border-radius: 20px;
      margin-bottom: 20px;
    }
  </style>
  `;

  let content = `
  <div class="container-wrapper">
    <div class="container">
      <div class="badge">Official Campus Information</div>
      <h1>${data.title}</h1>
      <p>${data.summary}</p>
  `;

  data.sections.forEach(section => {
    content += `<h2>${section.heading}</h2>`;

    if (section.content_type === "list") {
      content += `<ol>`;
      section.content.forEach(item => {
        content += `<li>${item}</li>`;
      });
      content += `</ol>`;
    } else {
      section.content.forEach(paragraph => {
        content += `<p>${paragraph}</p>`;
      });
    }
  });

  content += `
      <div class="footer">
        &copy; ${new Date().getFullYear()} Parul University yaha possible hain 😂😂😂😂| Admission Information Page
      </div>
    </div>
  </div>
  `;

  return styles + content;
}