import AdminNavbar from '../components/AdminNavbar';

function AdminWallet() {
    return (
        <div className="min-vh-100">
            <AdminNavbar />
            <div className="main-container">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h1 className="h3 fw-bold mb-1">Wallet Management</h1>
                        <p className="text-muted mb-0">Review transactions and manage platform funds</p>
                    </div>
                </div>

                <div className="section">
                    <div className="text-center py-5">
                        <div className="mb-4">
                            <span className="display-1 text-warning opacity-25">
                                <i className="bi bi-wallet2"></i>
                            </span>
                        </div>
                        <h2 className="h4 fw-bold mb-2">Coming Soon</h2>
                        <p className="text-muted mb-0" style={{ maxWidth: '500px', margin: '0 auto' }}>
                            Global transaction history and bulk top-up management features are currently under development.
                            Please use the <strong>Users</strong> page to manage individual user wallets.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AdminWallet;
