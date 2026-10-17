import {
    useEffect,
    useState,
} from 'react';

import {
    deleteAdminUser,
    getAdminUsers,
} from '../api/mangatrack.api';

import type {
    AdminUser,
} from '../api/mangatrack.api';

export function AdminPage() {
    const [
        users,
        setUsers,
    ] =
        useState<AdminUser[]>([]);

    const [
        loading,
        setLoading,
    ] =
        useState(true);

    const [
        error,
        setError,
    ] =
        useState<string | null>(
            null,
        );

    const [
        success,
        setSuccess,
    ] =
        useState<string | null>(
            null,
        );

    const [
        deletingId,
        setDeletingId,
    ] =
        useState<number | null>(
            null,
        );

    useEffect(() => {
        getAdminUsers()
            .then(
                setUsers,
            )
            .catch((err) => {
                setError(
                    err instanceof Error
                        ? err.message
                        : 'Erreur inconnue',
                );
            })
            .finally(() => {
                setLoading(
                    false,
                );
            });
    }, []);

    async function handleDelete(
        user: AdminUser,
    ) {
        if (
            user.role ===
            'admin'
        ) {
            return;
        }

        const confirmed =
            window.confirm(
                `Supprimer définitivement le compte ${user.email} ?`,
            );

        if (!confirmed) {
            return;
        }

        setError(
            null,
        );

        setSuccess(
            null,
        );

        setDeletingId(
            user.id,
        );

        try {
            await deleteAdminUser(
                user.id,
            );

            setUsers(
                (current) =>
                    current.filter(
                        (item) =>
                            item.id !==
                            user.id,
                    ),
            );

            setSuccess(
                `Le compte ${user.email} a été supprimé.`,
            );
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'Impossible de supprimer cet utilisateur.',
            );
        } finally {
            setDeletingId(
                null,
            );
        }
    }

    const adminCount =
        users.filter(
            (user) =>
                user.role ===
                'admin',
        ).length;

    const userCount =
        users.length -
        adminCount;

    if (loading) {
        return (
            <main className="admin-page">
                <section className="admin-heading">
                    <div>
                        <span className="page-eyebrow">
                            Gestion
                        </span>

                        <h2>
                            Administration
                        </h2>

                        <p>
                            Chargement des utilisateurs...
                        </p>
                    </div>
                </section>
            </main>
        );
    }

    return (
        <main className="admin-page">
            <section className="admin-heading">
                <div>
                    <span className="page-eyebrow">
                        Gestion
                    </span>

                    <h2>
                        Administration
                    </h2>

                    <p>
                        Consulte les comptes MangaTrack
                        et supprime les comptes
                        utilisateurs lorsque cela est
                        nécessaire.
                    </p>
                </div>

                <div className="admin-summary">
                    <article>
                        <strong>
                            {
                                users.length
                            }
                        </strong>

                        <span>
                            comptes
                        </span>
                    </article>

                    <article>
                        <strong>
                            {
                                userCount
                            }
                        </strong>

                        <span>
                            utilisateurs
                        </span>
                    </article>

                    <article>
                        <strong>
                            {
                                adminCount
                            }
                        </strong>

                        <span>
                            admins
                        </span>
                    </article>
                </div>
            </section>

            {success && (
                <p className="success-message">
                    {success}
                </p>
            )}

            {error && (
                <p className="error-message">
                    {error}
                </p>
            )}

            <section className="admin-users-section">
                <div className="section-heading">
                    <span className="page-eyebrow">
                        Comptes
                    </span>

                    <h3>
                        Utilisateurs MangaTrack
                    </h3>

                    <p>
                        Les comptes administrateurs
                        sont protégés contre la
                        suppression depuis cette
                        interface.
                    </p>
                </div>

                {users.length ===
                    0 ? (
                    <div className="admin-empty">
                        Aucun utilisateur.
                    </div>
                ) : (
                    <div className="admin-users-list">
                        {users.map(
                            (user) => (
                                <article
                                    key={
                                        user.id
                                    }
                                    className="admin-user-card"
                                >
                                    <div className="admin-user-avatar">
                                        {user.email
                                            .charAt(
                                                0,
                                            )
                                            .toUpperCase()}
                                    </div>

                                    <div className="admin-user-info">
                                        <div className="admin-user-heading">
                                            <h4>
                                                {
                                                    user.email
                                                }
                                            </h4>

                                            <span
                                                className={
                                                    user.role ===
                                                        'admin'
                                                        ? 'admin-role-badge admin-role-badge-admin'
                                                        : 'admin-role-badge'
                                                }
                                            >
                                                {user.role ===
                                                    'admin'
                                                    ? 'Administrateur'
                                                    : 'Utilisateur'}
                                            </span>
                                        </div>

                                        <span className="admin-user-id">
                                            ID #
                                            {
                                                user.id
                                            }
                                        </span>
                                    </div>

                                    <div className="admin-user-actions">
                                        {user.role ===
                                            'admin' ? (
                                            <span className="admin-protected">
                                                Compte protégé
                                            </span>
                                        ) : (
                                            <button
                                                type="button"
                                                className="admin-delete-button"
                                                disabled={
                                                    deletingId ===
                                                    user.id
                                                }
                                                onClick={() =>
                                                    handleDelete(
                                                        user,
                                                    )
                                                }
                                            >
                                                {deletingId ===
                                                    user.id
                                                    ? 'Suppression...'
                                                    : 'Supprimer'}
                                            </button>
                                        )}
                                    </div>
                                </article>
                            ),
                        )}
                    </div>
                )}
            </section>
        </main>
    );
}
