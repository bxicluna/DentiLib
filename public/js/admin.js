const userContainer = document.getElementById("mainUserTableBody");
const token = localStorage.getItem("token");
const role = localStorage.getItem("role");
const addUserButton = document.getElementById("openAddUserModal");
const modal = document.getElementById("addUserModal");
const closeModalBtn = document.getElementById("closeAddUserModal");
const cancelBtn = document.getElementById("cancelAddUser");
const firstNameForm = document.getElementById("firstName");
const lastNameForm = document.getElementById("lastName");
const emailForm = document.getElementById("email");
const passwordForm = document.getElementById("password");
const roleForm = document.getElementById("role");
const siretForm = document.getElementById("siret");
const userForm = document.getElementById("addUserForm");
const logoutButton = document.getElementById("logout");
const btnActes = document.getElementById("openActList");
const dentisteContainer = document.getElementById("dentisteContainer");
const dentisteTableBody = document.getElementById("dentisteTableBody");
const siretContainer = document.getElementById("siretContainer");
const editUserModal = document.getElementById("editUserModal");
const closeEditModalBtn = document.getElementById("closeEditUserModal");
const cancelEditBtn = document.getElementById("cancelEditUser");
const editUserForm = document.getElementById("editUserForm");
const editFirstName = document.getElementById("editFirstName");
const editLastName = document.getElementById("editLastName");
const editEmail = document.getElementById("editEmail");
const editSiret = document.getElementById("editSiret");
const editSiretContainer = document.getElementById("editSiretContainer");
const selectFilter = document.getElementById("type-filter");
const searchInput = document.getElementById("recherche-text");
const adminNameDiv = document.getElementById("adminName");
const messageSystem = document.getElementById("messageSystem");
const messageAddUser = document.getElementById("messageAddUser");
const messageEditUser = document.getElementById("messageEditUser");

const emailRegex = /^((?!\.)[\w\-_.]*[^.])(@\w+)(\.\w+(\.\w+)?[^.\W])$/;

let currentEditingUserId = null;
let selectedDentisteId = null;
let allUsers = [];

// ===== MESSAGES =====

function showMessage(text, type = "error") {
  messageSystem.textContent = text;
  messageSystem.style.display = "block";
  messageSystem.classList.remove("success");
  if (type === "success") messageSystem.classList.add("success");
  setTimeout(() => { messageSystem.style.display = "none"; }, 4000);
}

function showModalMessage(el, text, type = "error") {
  el.textContent = text;
  el.style.display = "block";
  el.classList.remove("success");
  if (type === "success") el.classList.add("success");
}

function hideModalMessage(el) {
  el.style.display = "none";
}

// ===== AUTH =====

function isTokenExpired(token) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp < Math.floor(Date.now() / 1000);
  } catch (e) {
    return true;
  }
}

if (!token || role !== "admin" || isTokenExpired(token)) {
  localStorage.removeItem("token");
  localStorage.removeItem("role");
  showMessage("Session expirée, veuillez vous reconnecter");
  setTimeout(() => { window.location.href = "/login.html"; }, 1500);
} else {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const prenom = payload.firstName || "";
    const nom = payload.lastName || "";
    const r = payload.role || "";
    adminNameDiv.textContent = `${prenom} ${nom} (${r.charAt(0).toUpperCase() + r.slice(1)})`;
  } catch (err) {
    console.error("Erreur récupération nom depuis le token :", err);
  }
}

// ===== MODAL AJOUT UTILISATEUR =====

addUserButton.addEventListener("click", () => {
  hideModalMessage(messageAddUser);
  modal.classList.add("active");
});

function closeAddUserModal() {
  modal.classList.remove("active");
  userForm.reset();
  siretContainer.classList.add("hidden");
  dentisteTableBody.innerHTML = "";
  dentisteContainer.classList.add("hidden");
  selectedDentisteId = null;
  hideModalMessage(messageAddUser);
}

closeModalBtn.addEventListener("click", () => { roleForm.value = "admin"; closeAddUserModal(); });
cancelBtn.addEventListener("click", () => { roleForm.value = ""; closeAddUserModal(); });

roleForm.addEventListener("change", () => {
  siretContainer.classList.add("hidden");
  hideModalMessage(messageAddUser);

  if (roleForm.value === "prothesiste") {
    siretContainer.classList.remove("hidden");
    dentisteContainer.classList.remove("hidden");
    chargerDentistes();
  } else if (roleForm.value === "dentiste") {
    siretContainer.classList.remove("hidden");
    dentisteContainer.classList.add("hidden");
    dentisteTableBody.innerHTML = "";
    selectedDentisteId = null;
  } else {
    dentisteContainer.classList.add("hidden");
    dentisteTableBody.innerHTML = "";
  }
});

async function addUser(e) {
  e.preventDefault();

  if (roleForm.value === "prothesiste" && !selectedDentisteId) {
    showModalMessage(messageAddUser, "Veuillez sélectionner un dentiste à associer au prothésiste");
    return;
  }

  try {
    const res = await fetch("/api/admin/createAccount", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        firstName: firstNameForm.value,
        lastName: lastNameForm.value,
        email: emailForm.value,
        password: passwordForm.value,
        role: roleForm.value,
        siret: siretForm.value,
        dentisteId: selectedDentisteId,
      }),
    });

    if (!res.ok) {
      let errorMsg = "Impossible de créer l'utilisateur";
      try { const data = await res.json(); errorMsg = data.message || errorMsg; } catch {}
      showModalMessage(messageAddUser, errorMsg);
      return;
    }

    closeAddUserModal();
    roleForm.value = "Sélectionner un rôle";
    showMessage("Utilisateur créé avec succès !", "success");
    chargerUser();
  } catch (error) {
    console.error("Erreur lors de l'ajout de l'utilisateur", error);
    showModalMessage(messageAddUser, "Erreur serveur, veuillez réessayer plus tard");
  }
}

// ===== MODAL MODIFICATION UTILISATEUR =====

function openEditUserModal(user) {
  currentEditingUserId = user.id;
  editFirstName.value = user.firstName;
  editLastName.value = user.lastName;
  editEmail.value = user.email;
  editSiret.value = user.siret || "";

  if (user.role !== "admin") {
    editSiretContainer.classList.remove("hidden");
  } else {
    editSiretContainer.classList.add("hidden");
  }

  hideModalMessage(messageEditUser);
  editUserModal.classList.add("active");
}

function closeEditModal() {
  editUserModal.classList.remove("active");
  hideModalMessage(messageEditUser);
}

closeEditModalBtn.addEventListener("click", closeEditModal);
cancelEditBtn.addEventListener("click", closeEditModal);

editUserForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!editFirstName.value.trim() || !editLastName.value.trim() || !editEmail.value.trim()) {
    showModalMessage(messageEditUser, "Merci de remplir tous les champs");
    return;
  }

  if (!emailRegex.test(editEmail.value.trim())) {
    showModalMessage(messageEditUser, "Le format de l'email est invalide");
    return;
  }

  try {
    const res = await fetch(`/api/admin/updateUser/${currentEditingUserId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        firstName: editFirstName.value.trim(),
        lastName: editLastName.value.trim(),
        email: editEmail.value.trim(),
        siret: editSiret.value,
      }),
    });

    if (!res.ok) {
      let errorMsg = "Impossible de modifier l'utilisateur";
      try { const data = await res.json(); errorMsg = data.message || errorMsg; } catch {}
      showModalMessage(messageEditUser, errorMsg);
      return;
    }

    closeEditModal();
    showMessage("Utilisateur modifié avec succès !", "success");
    chargerUser();
  } catch (error) {
    console.error("Erreur lors de la modification de l'utilisateur", error);
    showModalMessage(messageEditUser, "Erreur serveur, veuillez réessayer plus tard");
  }
});

// ===== CHARGEMENT & FILTRAGE DES UTILISATEURS =====

async function chargerUser() {
  try {
    const res = await fetch("/api/admin/getUserWithoutAdmin", {
      method: "GET",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    });

    if (!res.ok) { showMessage("Impossible de charger la liste des utilisateurs"); return; }

    allUsers = await res.json();
    filterAndDisplayUsers();
  } catch (error) {
    console.error("Erreur lors du chargement des utilisateurs", error);
    showMessage("Impossible de charger la liste des utilisateurs");
  }
}

function filterAndDisplayUsers() {
  const roleFilter = selectFilter.value.toLowerCase();
  const searchText = searchInput.value.toLowerCase().trim();

  const filtered = allUsers.filter((user) => {
    const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
    const roleMatch = roleFilter === "tous" || roleFilter === ""
      ? true
      : user.role.toLowerCase() === roleFilter;
    const textMatch = !searchText ||
      fullName.includes(searchText) ||
      user.email.toLowerCase().includes(searchText);
    return roleMatch && textMatch;
  });

  userContainer.innerHTML = "";

  for (const user of filtered) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${user.firstName} ${user.lastName}</td>
      <td>${user.email}</td>
      <td>${user.role}</td>
      <td>${
        user.associatedUser
          ? `${user.associatedUser.firstName} ${user.associatedUser.lastName} (${user.associatedUser.role})`
          : ""
      }</td>
      <td class="actions">
        <div>
          <button class="btn-edit" data-user='${JSON.stringify(user)}'>✏️</button>
          <button class="btn-delete" data-id="${user.id}">❌</button>
        </div>
      </td>
    `;
    userContainer.appendChild(tr);
  }

  document.querySelectorAll(".btn-edit").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const user = JSON.parse(e.currentTarget.dataset.user);
      openEditUserModal(user);
    });
  });

  document.querySelectorAll(".btn-delete").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      const userId = e.currentTarget.dataset.id;
      if (!confirm("Voulez-vous vraiment supprimer cet utilisateur ?")) return;

      try {
        const res = await fetch(`/api/user/deleteUser/${userId}`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          let errorMsg = "Impossible de supprimer cet utilisateur";
          try { const data = await res.json(); errorMsg = data.message || errorMsg; } catch {}
          showMessage(errorMsg);
          return;
        }

        showMessage("Utilisateur supprimé avec succès !", "success");
        chargerUser();
      } catch (error) {
        console.error("Erreur suppression utilisateur", error);
        showMessage("Erreur serveur, veuillez réessayer plus tard");
      }
    });
  });
}

// ===== CHARGEMENT DES DENTISTES DISPONIBLES =====

async function chargerDentistes() {
  try {
    const res = await fetch("/api/admin/getAllDentistes", {
      method: "GET",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    });
    const dentistes = await res.json();

    const dentistesDispo = dentistes.filter((d) => !d.associatedUserId);

    dentisteTableBody.innerHTML = "";

    if (dentistesDispo.length === 0) {
      dentisteTableBody.innerHTML = `<tr><td colspan="2" style="text-align:center;color:#9ca3af;">Aucun dentiste disponible</td></tr>`;
      return;
    }

    for (const dentiste of dentistesDispo) {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${dentiste.firstName} ${dentiste.lastName}</td>
        <td>${dentiste.email}</td>`;
      tr.dataset.id = dentiste.id;

      tr.addEventListener("click", () => {
        document.querySelectorAll("#dentisteTableBody tr").forEach((r) => r.classList.remove("selected"));
        tr.classList.add("selected");
        selectedDentisteId = dentiste.id;
      });

      dentisteTableBody.appendChild(tr);
    }
  } catch (error) {
    console.error("Erreur lors du chargement des dentistes", error);
    showMessage("Impossible de charger la liste des dentistes");
  }
}

// ===== NAVIGATION =====

btnActes.addEventListener("click", () => { window.location.href = "listeActes.html"; });
logoutButton.addEventListener("click", () => { localStorage.removeItem("token"); window.location.href = "login.html"; });

// ===== INIT =====

selectFilter.addEventListener("change", filterAndDisplayUsers);
searchInput.addEventListener("input", filterAndDisplayUsers);
userForm.addEventListener("submit", addUser);
chargerUser();
