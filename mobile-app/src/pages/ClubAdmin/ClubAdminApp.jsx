import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import MobileContainer from '../../components/Mobile/MobileContainer';
import Dashboard from './Dashboard';
import Members from './Members';
import Tasks from './Tasks';
import Settings from './Settings';
import MembershipPlans from './MembershipPlans';
import Feedback from './Feedback';
import QRScanner from './QRScanner';
import CreateClub from './CreateClub';
import EditClub from './EditClub';
import Events from './Events';

const ClubAdminApp = () => {
    return (
        <MobileContainer role="club-admin">
            <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/members" element={<Members />} />
                <Route path="/tasks" element={<Tasks />} />
                <Route path="/events" element={<Events />} />
                <Route path="/membership-plans" element={<MembershipPlans />} />
                <Route path="/feedback" element={<Feedback />} />
                <Route path="/scan-qr" element={<QRScanner />} />
                <Route path="/create-club" element={<CreateClub />} />
                <Route path="/edit-club" element={<EditClub />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </MobileContainer>
    );
};

export default ClubAdminApp;
