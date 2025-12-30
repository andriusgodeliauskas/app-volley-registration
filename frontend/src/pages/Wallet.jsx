import { Link } from 'react-router-dom';

function Wallet() {
    return (
        <div className="container py-5 text-center">
            <h1>Wallet</h1>
            <p className="lead">This feature is coming soon!</p>
            <Link to="/dashboard" className="btn btn-primary">Back to Dashboard</Link>
        </div>
    );
}

export default Wallet;
