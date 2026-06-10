const form = document.getElementById("login-form");
const emailInput = document.getElementById('email')
const passwordInput = document.getElementById("password")
const message = document.getElementById('messageSystem')

form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const email = emailInput.value.trim()
    const password = passwordInput.value.trim()

    if(!email || !password) {
        message.textContent = "Tous les champs sont requis"
        message.style.color = 'red'
        return
    }

    const regex = /^((?!\.)[\w\-_.]*[^.])(@\w+)(\.\w+(\.\w+)?[^.\W])$/

    if(!email.match(regex)){
        message.textContent = "Le format de l'email est invalide"
        message.style.color = 'red'
        return
    }

    if(password.length < 6){
        message.textContent = "Le mot de passe doit contenir au moins 6 caractères"
        message.style.color = 'red'
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
            message.textContent = responseData.message
            message.style.color = 'red'
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
        message.textContent = error.message
        message.style.color = 'red'
    }
})


