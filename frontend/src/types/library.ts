export type LibraryStatus =
    | 'a_commencer'
    | 'en_cours'
    | 'termine'
    | 'abandonne';

export interface LibraryEntry {
    id: number;
    userId: number;
    catalogItemId: number;
    status: LibraryStatus;
    progress: number;
    isFavorite: boolean;
}