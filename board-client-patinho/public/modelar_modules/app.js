console.log('rodando')

class Task {
    constructor(code, tasks = [], title, completed) {
        this.id = tasks.length;
        this.code = code;
        this.title = title;
        this.completed = completed;
    }
}

const useMyFetch = async (url2Fetch = 'https://jsonplaceholder.typicode.com/todos') => {
    const response = await fetch(url2Fetch);
    if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
    }
    const data = await response.json();
    return data;
};

const makeTable = async () => {
    try {
        const dataTulipeList = await useMyFetch();

        const appHTML = document.getElementById('B');

        appHTML.innerHTML = `
            <table>
                <thead>
                    <tr>
                        <th>Id</th>
                        <th>UserId</th>
                        <th>Title</th>
                        <th>Completed</th>
                    </tr>
                </thead>
                <tbody>
                    ${dataTulipeList.map(({ id, userId, title, completed }) => `
                        <tr>
                            <td>${id}</td>
                            <td>${userId}</td>
                            <td>${title}</td>
                            <td>${completed ? 'Yes' : 'No'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } catch (err) {
        console.error('Error loading table data:', err);
    }
};

makeTable();
