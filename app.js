const SUPABASE_URL = "https://wohyuqiqvvrdhqgxovyt.supabase.co";
const SUPABASE_KEY = "sb_publishable_1wOUFmJS8297s7jdqTza_A_wrNhR3AE";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ====== STATE ======
let prompts = [];
let categories = [];
let notifications = [];
let currentEditIndex = null;
let isDarkMode = false;

// ====== LOAD ALL DATA ======
async function loadData() {
    const { data: p } = await supabaseClient.from("prompts").select("*").order("id", { ascending: false });
    const { data: c } = await supabaseClient.from("categories").select("*").order("id", { ascending: false });
    const { data: n } = await supabaseClient.from("notifications").select("*").order("id", { ascending: false });

    prompts = p || [];
    categories = c || [];
    notifications = n || [];

    render();
}

// ====== TOAST ======
function showToast(msg, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.style.background = type === 'success' ? '#10b981' : '#ef4444';
    toast.style.display = 'block';
    setTimeout(() => toast.style.display = 'none', 2500);
}

// ====== IMAGE UPLOAD TO SUPABASE STORAGE ======
async function uploadImage(file) {
    if (!file) return "";

    const fileName = `${Date.now()}-${file.name}`;

    const { data, error } = await supabaseClient.storage
        .from("images")
        .upload(fileName, file);

    if (error) {
        console.log(error);
        return "";
    }

    const { data: publicUrl } = supabaseClient.storage
        .from("images")
        .getPublicUrl(fileName);

    return publicUrl.publicUrl;
}

// ====== ADD / UPDATE PROMPT ======
async function addPrompt() {
    const title = document.getElementById('title').value.trim();
    if (!title) return showToast('اكتب العنوان', 'error');

    let imageFile = document.getElementById('imageUpload').files[0];
    let imageUrl = document.getElementById('image').value.trim();

    if (imageFile) {
        imageUrl = await uploadImage(imageFile);
    }

    const payload = {
        title,
        image: imageUrl,
        category: document.getElementById('category').value,
        prompt: document.getElementById('prompt').value.trim(),
        description: document.getElementById('desc').value.trim(),
        platform: document.getElementById('platform').value,
        video_link: document.getElementById('videoLink').value.trim(),
        show_home: document.getElementById('showHome').checked
    };

    if (currentEditIndex !== null) {
        const id = prompts[currentEditIndex].id;

        await supabaseClient.from("prompts").update(payload).eq("id", id);
        showToast("تم التعديل");
    } else {
        await supabaseClient.from("prompts").insert(payload);
        showToast("تم الإضافة");
    }

    currentEditIndex = null;
    clearForm();
    loadData();
}

// ====== DELETE PROMPT ======
async function deletePrompt(index) {
    const id = prompts[index].id;

    await supabaseClient.from("prompts").delete().eq("id", id);
    showToast("تم الحذف");

    loadData();
}

// ====== CATEGORY ======
async function addCategory() {
    const name = document.getElementById('catName').value.trim();
    if (!name) return;

    await supabaseClient.from("categories").insert({ name });
    document.getElementById('catName').value = "";

    loadData();
}

// ====== DELETE CATEGORY ======
async function deleteCategory(index) {
    const id = categories[index].id;
    await supabaseClient.from("categories").delete().eq("id", id);
    loadData();
}

// ====== NOTIFICATIONS ======
async function addNotification() {
    const title = document.getElementById('notifTitle').value.trim();
    const desc = document.getElementById('notifDesc').value.trim();

    if (!title) return;

    await supabaseClient.from("notifications").insert({
        title,
        description: desc
    });

    document.getElementById('notifTitle').value = "";
    document.getElementById('notifDesc').value = "";

    loadData();
}

// ====== RENDER ======
function render() {

    document.getElementById('stats').innerHTML = `
        <div class="stat-card"><h3>${prompts.length}</h3><p>البرومبتات</p></div>
        <div class="stat-card"><h3>${categories.length}</h3><p>الأقسام</p></div>
        <div class="stat-card"><h3>${notifications.length}</h3><p>الإشعارات</p></div>
    `;

    // HOME
    document.getElementById('homeGrid').innerHTML = prompts
        .filter(p => p.show_home)
        .map((p, i) => `
        <div class="card">
            ${p.image ? `<img src="${p.image}">` : ""}
            <div class="card-content">
                <h3>${p.title}</h3>
                <p>${p.category}</p>
            </div>
        </div>
    `).join('');

    // LIST
    document.getElementById('list').innerHTML = prompts.map((p, i) => `
        <div class="card">
            ${p.image ? `<img src="${p.image}">` : ""}
            <div class="card-content">
                <h3>${p.title}</h3>
                <p>${p.category}</p>

                <button class="btn primary" onclick="startEdit(${i})">تعديل</button>
                <button class="btn" onclick="deletePrompt(${i})" style="background:red;color:white">حذف</button>
            </div>
        </div>
    `).join('');

    // CATEGORIES
    document.getElementById('catList').innerHTML = categories.map((c, i) => `
        <div class="card">
            <h3>${c.name}</h3>
            <button onclick="deleteCategory(${i})" class="btn" style="background:red;color:white">حذف</button>
        </div>
    `).join('');

    // NOTIFICATIONS
    document.getElementById('notifList').innerHTML = notifications.map(n => `
        <div class="card">
            <h3>${n.title}</h3>
            <p>${n.description || ""}</p>
        </div>
    `).join('');
}

// ====== EDIT ======
function startEdit(index) {
    const p = prompts[index];
    currentEditIndex = index;

    document.getElementById('title').value = p.title;
    document.getElementById('image').value = p.image;
    document.getElementById('category').value = p.category;
    document.getElementById('prompt').value = p.prompt;
    document.getElementById('desc').value = p.description;
    document.getElementById('videoLink').value = p.video_link;
    document.getElementById('showHome').checked = p.show_home;

    document.getElementById('form').classList.remove('hidden');
}

// ====== CLEAR FORM ======
function clearForm() {
    document.querySelectorAll('#form input, #form textarea').forEach(i => i.value = "");
    document.getElementById('showHome').checked = false;
}

// ====== INIT ======
window.onload = () => {
    loadData();
};
