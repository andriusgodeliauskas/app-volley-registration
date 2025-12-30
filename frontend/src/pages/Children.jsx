import { Link } from 'react-router-dom';

function Children() {
    return (
        <div className="container py-5 text-center">
            <h1>My Children</h1>
            <p className="lead">This feature is coming soon!</p>
            <Link to="/dashboard" className="btn btn-primary">Back to Dashboard</Link>
        </div>
    );
}

export default Children;
