// Avatar configurations - males first (26 total), then females (5)
export const AVATARS = [
    // Default - simple smiling male
    { id: 'default', params: 'hair=short01&skinColor=f2d3b1&mouth=variant30&eyes=variant26&eyebrows=variant10' },
    // Males with short hair (10 options)
    { id: 'male1', params: 'hair=short01&skinColor=f2d3b1&mouth=variant01&eyes=variant01' },
    { id: 'male2', params: 'hair=short02&skinColor=ecad80&mouth=variant02&eyes=variant02' },
    { id: 'male3', params: 'hair=short03&skinColor=f9c9b6&mouth=variant03&eyes=variant03' },
    { id: 'male4', params: 'hair=short04&skinColor=f2d3b1&mouth=variant04&eyes=variant04' },
    { id: 'male5', params: 'hair=short05&skinColor=ecad80&mouth=variant05&eyes=variant05' },
    { id: 'male6', params: 'hair=short06&skinColor=f9c9b6&mouth=variant06&eyes=variant06' },
    { id: 'male7', params: 'hair=short07&skinColor=f2d3b1&mouth=variant07&eyes=variant07' },
    { id: 'male8', params: 'hair=short08&skinColor=ecad80&mouth=variant08&eyes=variant08' },
    { id: 'male9', params: 'hair=short09&skinColor=f9c9b6&mouth=variant09&eyes=variant09' },
    { id: 'male10', params: 'hair=short10&skinColor=f2d3b1&mouth=variant10&eyes=variant10' },
    // More males - different short styles
    { id: 'male11', params: 'hair=short11&skinColor=f2d3b1&mouth=variant11&eyes=variant11' },
    { id: 'male12', params: 'hair=short12&skinColor=ecad80&mouth=variant12&eyes=variant12' },
    { id: 'male13', params: 'hair=short13&skinColor=f9c9b6&mouth=variant13&eyes=variant13' },
    { id: 'male14', params: 'hair=short14&skinColor=f2d3b1&mouth=variant14&eyes=variant14' },
    { id: 'male15', params: 'hair=short15&skinColor=ecad80&mouth=variant15&eyes=variant15' },
    { id: 'male16', params: 'hair=short16&skinColor=f9c9b6&mouth=variant16&eyes=variant16' },
    { id: 'male17', params: 'hair=short17&skinColor=f2d3b1&mouth=variant17&eyes=variant17' },
    { id: 'male18', params: 'hair=short18&skinColor=ecad80&mouth=variant18&eyes=variant18' },
    { id: 'male19', params: 'hair=short19&skinColor=f9c9b6&mouth=variant19&eyes=variant19' },
    // Males with glasses/accessories
    { id: 'male20', params: 'hair=short01&skinColor=f2d3b1&mouth=variant20&eyes=variant20&glasses=variant01' },
    { id: 'male21', params: 'hair=short02&skinColor=ecad80&mouth=variant21&eyes=variant21&glasses=variant02' },
    { id: 'male22', params: 'hair=short03&skinColor=f9c9b6&mouth=variant22&eyes=variant22&glasses=variant03' },
    { id: 'male23', params: 'hair=short04&skinColor=f2d3b1&mouth=variant23&eyes=variant23&glasses=variant04' },
    { id: 'male24', params: 'hair=short05&skinColor=ecad80&mouth=variant24&eyes=variant24&glasses=variant05' },
    { id: 'male25', params: 'hair=short06&skinColor=f9c9b6&mouth=variant25&eyes=variant25&eyebrows=variant01' },
    // Females with long hair (5 options)
    { id: 'female1', params: 'hair=long01&skinColor=f2d3b1&mouth=variant01&eyes=variant01' },
    { id: 'female2', params: 'hair=long02&skinColor=ecad80&mouth=variant02&eyes=variant02' },
    { id: 'female3', params: 'hair=long03&skinColor=f9c9b6&mouth=variant03&eyes=variant03' },
    { id: 'female4', params: 'hair=long04&skinColor=f2d3b1&mouth=variant04&eyes=variant04' },
    { id: 'female5', params: 'hair=long05&skinColor=ecad80&mouth=variant05&eyes=variant05' },
];

/**
 * Get avatar URL for a given avatar ID
 * @param {string} avatarId - The avatar ID (e.g., 'male1', 'female2', 'default')
 * @returns {string} The full DiceBear avatar URL
 */
export const getAvatarUrl = (avatarId) => {
    const avatar = AVATARS.find(a => a.id === avatarId);
    if (avatar) {
        return `https://api.dicebear.com/9.x/adventurer/svg?seed=${avatarId}&${avatar.params}`;
    }
    // Fallback for old avatar seeds or unknown IDs - use default params
    return `https://api.dicebear.com/9.x/adventurer/svg?seed=${avatarId}&skinColor=f2d3b1`;
};
