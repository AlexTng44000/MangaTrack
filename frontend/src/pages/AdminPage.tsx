import {
    useEffect,
    useState,
} from 'react';

import {
    getAdminUsers,
} from '../api/mangatrack.api';

import type {
    AdminUser,
} from '../api/mangatrack.api';

export function AdminPage() {
    const [users, setUsers] =
        useState<AdminUser[]>([]);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState<string | null>(null);

    useEffect(() => {
        getAdminUsers()
            .then(setUsers)
            .catch((err) => {
                setError(
                    err instanceof Error
                        ? err.message
                        : 'Erreur inconnue',
                );
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    if (loading) {
        return <p>Chargement...</p>;
    }

    if (error) {
        return (
            <p className="error-message">
                {error}
            </p>
        );
    }

    return (
        <main>
            <h2>Administration</h2>

            <p>
                Utilisateurs MangaTrack
            </p>

            <div className="catalog">
                {users.map((user) => (
                    <article
                        key={user.id}
                        className="catalog-card"
                    >
                        <h3>{user.email}</h3>

                        <p>
                            ID : {user.id}
                        </p>

                        <p>
                            Rôle : {user.role}
                        </p>
                    </article>
                ))}
            </div>
        </main>
    );
}