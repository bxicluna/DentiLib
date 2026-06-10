const form = document.getElementById("login-form");
const emailInput = document.getElementById('email')
const passwordInput = document.getElementById("password")
const message = document.getElementById('messageSystem')

form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const email = emailInput.value.trim()
    const password = passwordInput.value.trim()

    if(!email || !password) {
        showMessage("Tous les champs sont requis")
        return
    }

    const regex = /^((?!\.)[\w\-_.]*[^.])(@\w+)(\.\w+(\.\w+)?[^.\W])$/

    if(!email.match(regex)){
        showMessage("Le format de l'email est invalide")
        return
    }

    if(password.length < 6){
        showMessage("Le mot de passe doit contenir au moins 6 caractères")
        return
    }

    try {
        const response = await fetch('/api/user/login',
            {
                method: "POST",
                headers: { "Content-type": "application/json" },
                body: JSON.stringify({ email: email, password: password}),
            }
        )

        const responseData = await response.json()

        console.log(responseData)

        if(!response.ok) {
            showMessage(responseData.message || "Identifiants incorrects")
        } else {

            console.log(responseData.role);
            if(responseData.token){
                localStorage.setItem('token', responseData.token)
            }
            

            switch(responseData.role){
                case 'admin':
                    localStorage.setItem('role', responseData.role)
                    window.location.href = "/admin.html"
                    break;
                case 'dentiste':
                    localStorage.setItem('role', responseData.role)
                    window.location.href = "/dentiste.html"
                    break;
                case 'prothesiste':
                    localStorage.setItem('role', responseData.role)
                    window.location.href = "/prothesiste.html"
                    break;
                default:
                    console.log('Role inconnu')
            }
            
        }



    } catch(error) {
        showMessage("Erreur serveur, veuillez réessayer plus tard")
    }
})

function showMessage(text, type = "error") {
    message.textContent = text
    message.style.display = "block"
    message.classList.remove("success")
    if (type === "success") message.classList.add("success")
}


