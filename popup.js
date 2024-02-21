// 在页面加载完成后执行一些操作
chrome.tabs.query({ active: true, currentWindow: true }, async function (tabs) {
    const currentTab = tabs[0];
    const currentUrl = currentTab.url;

    // 从当前页面 URL 中获取 owner 和 repo
    const { owner, repo } = getOwnerAndRepoFromUrl(currentUrl);
    if (owner && repo) {
        // 获取 GitHub 项目的 README.md 内容
        const readmeContent = await fetchReadme(owner, repo);
        if (readmeContent) {
            // 使用 marked.js 解析 Markdown 内容
            const decodedContent = decodeURIComponent(escape(window.atob(readmeContent)));
            const toc = generateTableOfContents(decodedContent);
            // 将目录显示在页面上
            const sidebar = document.getElementById('sidebar');
            sidebar.innerHTML = toc;
        }
    } else {
        console.error('Not a valid GitHub project page.');
    }
});

// Function to extract owner and repo from GitHub URL
function getOwnerAndRepoFromUrl(url) {
    const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (match && match.length === 3) {
        const owner = match[1];
        const repo = match[2];
        return { owner, repo };
    }
    return { owner: null, repo: null };
}

// GitHub API endpoint to fetch README.md content
const readmeUrl = "https://api.github.com/repos/:owner/:repo/readme";

// Function to fetch README.md content from GitHub
async function fetchReadme(owner, repo) {
    const url = readmeUrl.replace(":owner", owner).replace(":repo", repo);
    try {
        const response = await fetch(url);
        const data = await response.json();
        const readmeContent = data.content; // Content is already base64 encoded
        return readmeContent;
    } catch (error) {
        console.error("Error fetching README.md:", error);
        return null;
    }
}

function generateTableOfContents(markdownContent) {
    const tokens = marked.lexer(markdownContent); // Parse Markdown content into tokens
    // let toc = "<ul>";
    let toc = "";
    let prevLevel = 0; // Track the previous heading level
    tokens.forEach(token => {
        if (token.type.startsWith('heading')) {
            const title = token.text;
            const level = token.depth; // Get the depth of the heading
            const id = title.replace(/\s+/g, "-").toLowerCase();
            // Calculate the indentation based on the heading level difference
            const indent = level - prevLevel > 0 ? "<ul>".repeat(level - prevLevel) : "</ul>".repeat(prevLevel - level);
            toc += `${indent}<li><a href="#${id}">${title}</a>`;
            prevLevel = level; // Update the previous heading level
        }
    });
    // Close any remaining open unordered lists
    // toc += "</li>" + "</ul>".repeat(prevLevel);
    return toc;
}


