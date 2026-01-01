import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

function Breadcrumb({ items }) {
    const { t } = useLanguage();

    return (
        <nav aria-label="breadcrumb" className="mb-3">
            <ol className="breadcrumb mb-0">
                {items.map((item, index) => {
                    const isLast = index === items.length - 1;
                    return (
                        <li
                            key={index}
                            className={`breadcrumb-item ${isLast ? 'active' : ''}`}
                            aria-current={isLast ? 'page' : undefined}
                        >
                            {isLast ? (
                                <span>{item.label}</span>
                            ) : (
                                <Link to={item.path}>{item.label}</Link>
                            )}
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
}

export default Breadcrumb;
