// Replace with the actual address of your deployed contract
const contractAddress = '0xD36046a91a39aEbaee1819C8e09739472EC21000'; 

// Replace with your contract's ABI (obtained from compiler output)
const contractABI = [
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "_content",
                "type": "string"
            }
        ],
        "name": "post",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "_postId",
                "type": "uint256"
            }
        ],
        "name": "likePost",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "postId",
                "type": "uint256"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "creator",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "string",
                "name": "content",
                "type": "string"
            }
        ],
        "name": "PostCreated",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "postId",
                "type": "uint256"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "liker",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "newLikesCount",
                "type": "uint256"
            }
        ],
        "name": "PostLiked",
        "type": "event"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "_postId",
                "type": "uint256"
            }
        ],
        "name": "getLikes",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "name": "posts",
        "outputs": [
            {
                "internalType": "address",
                "name": "creator",
                "type": "address"
            },
            {
                "internalType": "string",
                "name": "content",
                "type": "string"
            },
            {
                "internalType": "uint256",
                "name": "likes",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "timestamp",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "name": "userLikes",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    }
];

let provider;
let signer;
let contract;

const connectButton = document.getElementById('connectButton');
const walletAddressDisplay = document.getElementById('walletAddress');
const postContentInput = document.getElementById('postContent');
const submitPostButton = document.getElementById('submitPostButton');
const postsContainer = document.getElementById('postsContainer');
const postIdInput = document.getElementById('postIdInput');
const getLikesButton = document.getElementById('getLikesButton');
const likesCountDisplay = document.getElementById('likesCount');

// Connect to MetaMask
async function connectWallet() {
    try {
        if (!window.ethereum) {
            alert('MetaMask not detected! Please install it to use this dApp. 🦊');
            return;
        }

        await window.ethereum.request({ method: 'eth_requestAccounts' });
        
        provider = new ethers.BrowserProvider(window.ethereum);
        signer = await provider.getSigner();
        
        contract = new ethers.Contract(contractAddress, contractABI, signer);
        
        const address = await signer.getAddress();
        walletAddressDisplay.innerText = `Connected: ${address}`;
        connectButton.style.display = 'none';

        // Enable the Post button after a successful connection
        submitPostButton.disabled = false;

        // Listen for new posts and update the UI
        contract.on('PostCreated', (postId, creator, content) => {
            console.log(`New post created with ID: ${postId.toString()}`);
            displayPost({ postId: postId.toString(), creator, content, likes: 0, timestamp: Date.now() });
        });

        // Listen for post likes and update the UI
        contract.on('PostLiked', (postId, liker, newLikesCount) => {
            console.log(`Post ${postId.toString()} was liked.`);
            updatePostLikes(postId.toString(), newLikesCount.toString());
        });
        
    } catch (error) {
        console.error('Failed to connect wallet:', error);
        alert('Failed to connect wallet. See console for details.');
    }
}

// Post a new message
async function postMessage() {
    const content = postContentInput.value;
    if (!contract) {
        alert('Please connect your wallet first!');
        return;
    }
    
    if (!content) {
        alert('Please enter some content to post.');
        return;
    }

    try {
        const tx = await contract.post(content);
        await tx.wait(); // Wait for the transaction to be mined

        alert('Post submitted successfully!');
        postContentInput.value = '';
    } catch (error) {
        console.error('Failed to post message:', error);
        alert('Failed to post message. See console for details.');
    }
}

// Like a post
async function likePost(postId) {
    if (!contract) {
        alert('Please connect your wallet first!');
        return;
    }

    try {
        const tx = await contract.likePost(postId);
        await tx.wait(); // Wait for the transaction to be mined

        alert(`You liked post #${postId}!`);
    } catch (error) {
        console.error('Failed to like post:', error);
        alert('Failed to like post. See console for details.');
    }
}

// Get the number of likes for a post
async function getLikes() {
    const postId = postIdInput.value;
    if (!postId) {
        alert('Please enter a Post ID.');
        return;
    }

    try {
        const likes = await contract.getLikes(postId);
        likesCountDisplay.innerText = `Likes: ${likes.toString()}`;
    } catch (error) {
        console.error('Failed to get likes:', error);
        likesCountDisplay.innerText = 'Error';
        alert('Failed to get likes. See console for details.');
    }
}

// Function to display a single post on the page
function displayPost(post) {
    const postElement = document.createElement('div');
    postElement.className = 'post-card';
    postElement.innerHTML = `
        <div class="content">Post ID: ${post.postId}</div>
        <div class="content">${post.content}</div>
        <div class="info">
            Created by: ${post.creator.substring(0, 6)}...${post.creator.substring(38)}
            <br>
            <span id="likes-count-${post.postId}">Likes: ${post.likes}</span>
            <button class="like-button" onclick="likePost(${post.postId})">❤️ Like</button>
        </div>
    `;
    postsContainer.prepend(postElement);
}

// Function to update the like count for a specific post
function updatePostLikes(postId, newLikesCount) {
    const likesElement = document.getElementById(`likes-count-${postId}`);
    if (likesElement) {
        likesElement.innerText = `Likes: ${newLikesCount}`;
    }
}

// Event listeners
connectButton.addEventListener('click', connectWallet);
submitPostButton.addEventListener('click', postMessage);
getLikesButton.addEventListener('click', getLikes);

// Initial check for MetaMask on page load
window.addEventListener('load', async () => {
    if (window.ethereum) {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0)
            
            {
            connectWallet();
        }
    }
});