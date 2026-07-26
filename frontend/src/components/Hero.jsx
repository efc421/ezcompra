function Hero() {
    return (
        <section className="hero">
            <div className="hero-content">
                <span className="eyebrow">Marketplace for everyone</span>

                <h1>Everything you want, all in one place.</h1>

                <p>
                    Discover popular products, trusted sellers and competitive
                    prices across every category.
                </p>

                <a className="primary-button" href="#featured-products">
                    Shop now
                </a>
            </div>

            <div className="hero-card">
                <span>Summer deals</span>
                <strong>Up to 40% off</strong>
                <p>Selected products for a limited time.</p>
            </div>
        </section>
    );
}

export default Hero;