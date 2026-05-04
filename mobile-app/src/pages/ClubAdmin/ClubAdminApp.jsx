import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import MobileContainer from '../../components/Mobile/MobileContainer';
import ProtectedClubRoute from '../../components/ProtectedClubRoute';
import Dashboard from './Dashboard';
import Members from './Members';
import Tasks from './Tasks';
import Settings from './Settings';
import MembershipPlans from './MembershipPlans';
import Feedback from './Feedback';
import QRScanner from './QRScanner';
import CreateClub from './CreateClub';
import EditClub from './EditClub';
import ClubStatus from './ClubStatus';
import Events from './Events';
import IntroLetterHistory from './IntroLetterHistory';
import Payments from './Payments';

const ClubAdminApp = () => {
    return (
        <MobileContainer role="club-admin">
            <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/members" element={<ProtectedClubRoute><Members /></ProtectedClubRoute>} />
                <Route path="/tasks" element={<ProtectedClubRoute><Tasks /></ProtectedClubRoute>} />
                <Route path="/events" element={<ProtectedClubRoute><Events /></ProtectedClubRoute>} />
                <Route path="/membership-plans" element={<ProtectedClubRoute><MembershipPlans /></ProtectedClubRoute>} />
                <Route path="/feedback" element={<ProtectedClubRoute><Feedback /></ProtectedClubRoute>} />
                <Route path="/scan-qr" element={<ProtectedClubRoute><QRScanner /></ProtectedClubRoute>} />
                <Route path="/payments" element={<ProtectedClubRoute><Payments /></ProtectedClubRoute>} />
                <Route path="/create-club" element={<CreateClub />} />
                <Route path="/edit-club" element={<EditClub />} />
                <Route path="/club-status" element={<ClubStatus />} />
                <Route path="/intro-letter-history" element={<ProtectedClubRoute><IntroLetterHistory /></ProtectedClubRoute>} />
                <Route path="/settings" element={<Settings />} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </MobileContainer>
    );
}

export default ClubAdminApp;
