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
    rating: number | null;
}

export interface LibraryStats {
    totalWorks: number;
    favorites: number;
    ratedWorks: number;
    averageRating: number | null;

    statuses: {
        aCommencer: number;
        enCours: number;
        termine: number;
        abandonne: number;
    };

    anime: {
        count: number;
        progress: number;
    };

    manga: {
        count: number;
        progress: number;
    };
}