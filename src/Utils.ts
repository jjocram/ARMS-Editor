export function generateId(elementType: string) {
    const randomString = Math.random().toString(36).substring(2, 9);
    return `${elementType}_${randomString}`;
}