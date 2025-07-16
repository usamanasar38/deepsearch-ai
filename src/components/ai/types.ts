export interface Thread {
    id: string
    title: string
    createdAt: number
    authorId: string
    pinned?: boolean
}
