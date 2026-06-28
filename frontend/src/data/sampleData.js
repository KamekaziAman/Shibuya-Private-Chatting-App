export const currentUser = {
  id: "me",
  username: "Alex Morgan",
  role: "Product designer",
};

export const conversations = [
  {
    id: 1,
    username: "Maya Chen",
    initials: "MC",
    avatarGradient: "from-zinc-950 via-zinc-700 to-zinc-500",
    lastMessage: "The new motion pass feels perfect ✨",
    timestamp: "10:42",
    unreadCount: 3,
    online: true,
    status: "Active now",
  },
  {
    id: 2,
    username: "Noah Williams",
    initials: "NW",
    avatarGradient: "from-neutral-800 via-neutral-600 to-neutral-400",
    lastMessage: "Shared the research notes with you",
    timestamp: "9:18",
    unreadCount: 0,
    online: true,
    status: "Active now",
  },
  {
    id: 3,
    username: "Sofia Rossi",
    initials: "SR",
    avatarGradient: "from-stone-800 via-stone-600 to-stone-400",
    lastMessage: "Let’s ship it before the standup",
    timestamp: "Yesterday",
    unreadCount: 0,
    online: false,
    status: "Last seen 24m ago",
  },
  {
    id: 4,
    username: "Design crew",
    initials: "DC",
    avatarGradient: "from-black via-zinc-800 to-zinc-500",
    lastMessage: "Leo: Added comments to the prototype",
    timestamp: "Yesterday",
    unreadCount: 7,
    online: false,
    status: "8 members",
    isGroup: true,
  },
  {
    id: 5,
    username: "Ethan Cole",
    initials: "EC",
    avatarGradient: "from-slate-900 via-slate-700 to-slate-500",
    lastMessage: "That sounds good to me!",
    timestamp: "Mon",
    unreadCount: 0,
    online: false,
    status: "Last seen Monday",
  },
  {
    id: 6,
    username: "Olivia Park",
    initials: "OP",
    avatarGradient: "from-neutral-900 via-neutral-700 to-neutral-500",
    lastMessage: "Can you review the final copy?",
    timestamp: "Sun",
    unreadCount: 1,
    online: true,
    status: "Active now",
  },
];

export const messagesByConversation = {
  1: [
    {
      id: 101,
      content: "Morning! I pushed the updated onboarding flow.",
      sender: "them",
      timestamp: "10:12",
    },
    {
      id: 102,
      content: "Just opened it — the new hierarchy is so much clearer.",
      sender: "me",
      timestamp: "10:15",
    },
    {
      id: 103,
      content: "Especially this moment. It finally has the breathing room we wanted.",
      sender: "them",
      timestamp: "10:17",
      attachment: {
        type: "image",
        name: "onboarding-preview.png",
        url: "https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=900&h=600&fit=crop",
      },
    },
    {
      id: 104,
      content: "Agreed. I’ll tune the transition curve and then we’re ready for review.",
      sender: "me",
      timestamp: "10:23",
      status: "Read",
    },
    {
      id: 105,
      content: "Here’s the motion reference I mentioned: https://linear.app",
      sender: "them",
      timestamp: "10:38",
    },
    {
      id: 106,
      content: "The new motion pass feels perfect ✨",
      sender: "them",
      timestamp: "10:42",
    },
  ],
  2: [
    {
      id: 201,
      content: "I wrapped up the discovery interviews.",
      sender: "them",
      timestamp: "9:02",
    },
    {
      id: 202,
      content: "Shared the research notes with you",
      sender: "them",
      timestamp: "9:18",
      attachment: { type: "file", name: "Research synthesis.pdf", size: "4.8 MB" },
    },
    {
      id: 203,
      content: "Brilliant, I’ll read through before our sync.",
      sender: "me",
      timestamp: "9:22",
      status: "Delivered",
    },
  ],
  3: [
    {
      id: 301,
      content: "The release candidate is looking stable.",
      sender: "them",
      timestamp: "16:10",
    },
    {
      id: 302,
      content: "Let’s ship it before the standup",
      sender: "them",
      timestamp: "16:12",
    },
  ],
  4: [
    {
      id: 401,
      content: "I added the latest components to our shared library.",
      sender: "them",
      senderName: "Priya",
      timestamp: "14:03",
    },
    {
      id: 402,
      content: "The variables are beautifully organized. Thank you!",
      sender: "me",
      timestamp: "14:09",
    },
    {
      id: 403,
      content: "Added comments to the prototype",
      sender: "them",
      senderName: "Leo",
      timestamp: "14:22",
      attachment: { type: "file", name: "Prototype notes.fig", size: "12 MB" },
    },
  ],
  5: [
    { id: 501, content: "How does Thursday afternoon sound?", sender: "me", timestamp: "11:04" },
    { id: 502, content: "That sounds good to me!", sender: "them", timestamp: "11:11" },
  ],
  6: [
    { id: 601, content: "Can you review the final copy?", sender: "them", timestamp: "18:30" },
  ],
};

export function formatTime() {
  return new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}
