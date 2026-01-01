import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';

function Children() {
    return (
        <div className="min-vh-100">
            <Navbar />
            <div className="main-container">
                <div className="section text-center py-5">
                    <h1>My Children</h1>
                    <p className="lead text-muted">This feature is coming soon!</p>
                    <Link to="/dashboard" className="btn-custom bg-primary text-white border-primary">Back to Dashboard</Link>
                </div>
            </div>
        </div>
    );
}

export default Children;
