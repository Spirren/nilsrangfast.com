const siteData = {
  email: "nils.rangfast@gmail.com",
  phone: "+46 73 434 87 17",
  location: "Göteborg, Sweden",
  linkedin: "linkedin.com/in/nils-wickenberg",
  github: "github.com/Spirren",
};

document.getElementById("email").textContent = siteData.email;
document.getElementById("phone").textContent = siteData.phone;
document.getElementById("linkedin").textContent = siteData.linkedin;
document.getElementById("linkedin").href = "https://www." + siteData.linkedin;
document.getElementById("location").textContent = siteData.location;
document.getElementById("github").href = "https://www." + siteData.github;
document.getElementById("github").textContent = siteData.github;

//toggle meny
document.getElementById("menu-toggle").addEventListener("click", () => {
  document.getElementById("nav-links").classList.toggle("show");
});
