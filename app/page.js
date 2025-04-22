'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Head from 'next/head';
import { FaUserCog } from 'react-icons/fa';
import { RiLoginCircleLine } from 'react-icons/ri';
import styles from '@/styles/Home.module.css';

export default function HomePage() {
  const router = useRouter();
  
  return (
    <div className={styles.container}>
      <Head>
        <title>RideShare | Home</title>
      </Head>
      
      <div className={styles.grid}>
        <div className={styles.imageContainer}>
          <Image
            src="/carpool-image.png" 
            alt="carpooling"
            fill
            style={{ objectFit: 'cover' }}
            priority
          />
        </div>
        
        <div className={styles.content}>
          <h1 className={styles.title}>
            <span>Welcome to RideShare</span>
          </h1>
          
          <p className={styles.description}>
            Find rides or share your journey with others. Save money and reduce your carbon footprint.
          </p>
          
          <div className={styles.buttonContainer}>
            <button
              className={styles.registerButton}
              onClick={() => router.push('/register')}
            >
              <FaUserCog className={styles.icon} />
              Register
            </button>
            
            <button
              className={styles.loginButton}
              onClick={() => router.push('/login')}
            >
              <RiLoginCircleLine className={styles.icon} />
              Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}