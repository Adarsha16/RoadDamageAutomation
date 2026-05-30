import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import Problem from '../components/Problem';
import Approach from '../components/Approach';
import Dataset from '../components/Dataset';
import Footer from '../components/Footer';

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Problem />

        <Dataset />
      </main>
      <Footer />
    </>
  );
}
