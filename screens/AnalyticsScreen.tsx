import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, Dimensions, TouchableOpacity, Share, Alert } from 'react-native';
import styled from 'styled-components/native';
import auth from '@react-native-firebase/auth';
import { onShiftsChange, onSwapsChange, Shift, Swap } from './firestoreHelpers';
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import RNFS from 'react-native-fs';
import ShareRN from 'react-native-share';
import { Platform } from 'react-native';

const Card = styled.View`
  background: #fff;
  border-radius: 16px;
  padding: 20px;
  margin: 16px 0;
  shadow-color: #000;
  shadow-opacity: 0.08;
  shadow-radius: 8px;
  shadow-offset: 0px 2px;
  elevation: 2;
`;
const Title = styled.Text`
  color: #2D4F4A;
  font-size: 22px;
  font-weight: bold;
  margin-bottom: 12px;
`;
const Stat = styled.Text`
  color: #44291A;
  font-size: 18px;
  margin-bottom: 6px;
`;

// Helper to generate CSV from array of objects
function toCSV(rows: any[], headers: string[]): string {
  const escape = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  return [headers.join(','), ...rows.map(row => headers.map(h => escape(row[h])).join(','))].join('\n');
}

export default function AnalyticsScreen({ navigation }: any) {
  const user = auth().currentUser;
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [swaps, setSwaps] = useState<Swap[]>([]);
  const [loading, setLoading] = useState(true);

  // Add isAdmin check
  const isAdmin = user?.email?.endsWith('@admin.com');

  // For admin: aggregate all shifts and swaps
  const [allShifts, setAllShifts] = useState<Shift[]>([]);
  const [allSwaps, setAllSwaps] = useState<Swap[]>([]);
  useEffect(() => {
    if (!isAdmin) return;
    const unsubShifts = onShiftsChange(setAllShifts);
    const unsubSwaps = onSwapsChange(setAllSwaps);
    return () => { unsubShifts(); unsubSwaps(); };
  }, [isAdmin]);

  // Stats
  const totalShifts = shifts.length;
  const totalHours = shifts.reduce((sum, s) => {
    const start = new Date(s.start);
    const end = new Date(s.end);
    return sum + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
  }, 0);
  const swapsCompleted = swaps.filter(s => s.status === 'accepted').length;
  const openShiftsFilled = shifts.filter(s => s.status === 'assigned').length;
  // Shifts per location
  const locationCounts: Record<string, number> = {};
  shifts.forEach(s => {
    if (s.location) locationCounts[s.location] = (locationCounts[s.location] || 0) + 1;
  });
  const locationData = Object.entries(locationCounts);

  // Advanced Analytics
  // Average shift length
  const avgShiftLength = totalShifts > 0 ? totalHours / totalShifts : 0;
  // Most common shift location
  const mostCommonLocation = locationData.length > 0 ? locationData.sort((a, b) => b[1] - a[1])[0][0] : null;
  // Swap acceptance rate
  const swapAcceptanceRate = swaps.length > 0 ? (swaps.filter(s => s.status === 'accepted').length / swaps.length) * 100 : 0;
  // For admin: user with most swaps
  let userWithMostSwaps: [string, number] | null = null;
  if (isAdmin && allSwaps.length > 0) {
    const swapCounts: Record<string, number> = {};
    allSwaps.forEach(s => {
      swapCounts[s.requesterId] = (swapCounts[s.requesterId] || 0) + 1;
      swapCounts[s.targetUserId] = (swapCounts[s.targetUserId] || 0) + 1;
    });
    userWithMostSwaps = Object.entries(swapCounts).sort((a, b) => b[1] - a[1])[0];
  }
  // Wallet/credits analytics (if wallet data is available)

  // Admin stats
  const adminTotalShifts = allShifts.length;
  const adminOpenShifts = allShifts.filter(s => s.status === 'open').length;
  const adminFilledOpenShifts = allShifts.filter(s => s.status === 'assigned').length;
  const adminSwaps = allSwaps.length;
  // Busiest day
  const dayCounts: Record<string, number> = {};
  allShifts.forEach(s => {
    const day = new Date(s.start).toLocaleDateString();
    dayCounts[day] = (dayCounts[day] || 0) + 1;
  });
  const busiestDay = Object.entries(dayCounts).sort((a, b) => b[1] - a[1])[0];
  // Top users by shifts
  const userCounts: Record<string, number> = {};
  allShifts.forEach(s => {
    if (s.userId) userCounts[s.userId] = (userCounts[s.userId] || 0) + 1;
  });
  const topUsers = Object.entries(userCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

  useEffect(() => {
    const unsubShifts = onShiftsChange(all => {
      setShifts(all.filter(s => s.userId === user?.uid));
    });
    const unsubSwaps = onSwapsChange(all => {
      setSwaps(all.filter(s => s.requesterId === user?.uid || s.targetUserId === user?.uid));
      setLoading(false);
    });
    return () => { unsubShifts(); unsubSwaps(); };
  }, [user]);

  if (loading) return <ActivityIndicator style={{ flex: 1 }} color="#A15C48" />;

  // Add export handler
  const handleExportCSV = async () => {
    try {
      const isAdminUser = isAdmin;
      const exportShifts = isAdminUser ? allShifts : shifts;
      const exportSwaps = isAdminUser ? allSwaps : swaps;
      const shiftHeaders = ['shiftId','userId','start','end','location','status'];
      const swapHeaders = ['swapId','requesterId','targetUserId','requesterShiftId','targetShiftId','status','createdAt'];
      const shiftCSV = toCSV(exportShifts, shiftHeaders);
      const swapCSV = toCSV(exportSwaps, swapHeaders);
      const csv = `Shifts\n${shiftCSV}\n\nSwaps\n${swapCSV}`;
      // Write CSV to file in a shareable location
      let filePath;
      if (Platform.OS === 'android') {
        filePath = `${RNFS.ExternalDirectoryPath}/ShiftBuddy_Analytics_${Date.now()}.csv`;
      } else {
        filePath = `${RNFS.CachesDirectoryPath}/ShiftBuddy_Analytics_${Date.now()}.csv`;
      }
      await RNFS.writeFile(filePath, csv, 'utf8');
      Alert.alert('CSV File Path', filePath);
      await ShareRN.open({
        url: 'file://' + filePath,
        type: 'text/csv',
        failOnCancel: false,
      });
      Alert.alert('Exported', 'CSV file ready to share or save.');
    } catch (err) {
      console.error('CSV export error:', err);
      Alert.alert('Error', 'Failed to export CSV.');
    }
  };

  // Add PDF export handler
  const handleExportPDF = async () => {
    try {
      const isAdminUser = isAdmin;
      const exportShifts = isAdminUser ? allShifts : shifts;
      const exportSwaps = isAdminUser ? allSwaps : swaps;
      // Build HTML report
      let html = `<h1>ShiftBuddy Analytics Report</h1>`;
      html += `<h2>${isAdminUser ? 'Admin' : 'Personal'} Stats</h2>`;
      html += `<ul>`;
      html += `<li>Total Shifts: ${isAdminUser ? adminTotalShifts : totalShifts}</li>`;
      html += `<li>Total Hours: ${(isAdminUser ? allShifts : shifts).reduce((sum, s) => { const start = new Date(s.start); const end = new Date(s.end); return sum + (end.getTime() - start.getTime()) / (1000 * 60 * 60); }, 0).toFixed(1)}</li>`;
      html += `<li>Swaps Completed: ${isAdminUser ? adminSwaps : swapsCompleted}</li>`;
      html += `<li>Open Shifts: ${isAdminUser ? adminOpenShifts : ''}</li>`;
      html += `<li>Filled Open Shifts: ${isAdminUser ? adminFilledOpenShifts : openShiftsFilled}</li>`;
      html += `</ul>`;
      if (isAdminUser) {
        html += `<h3>Busiest Day: ${busiestDay ? `${busiestDay[0]} (${busiestDay[1]})` : 'N/A'}</h3>`;
        html += `<h3>Top Users by Shifts</h3><ul>`;
        topUsers.forEach(([uid, count]) => {
          html += `<li>${uid}: ${count}</li>`;
        });
        html += `</ul>`;
      }
      html += `<h3>Shifts per Location</h3><ul>`;
      locationData.forEach(([loc, count]) => {
        html += `<li>${loc}: ${count}</li>`;
      });
      html += `</ul>`;
      html += `<h3>Advanced Analytics</h3><ul>`;
      html += `<li>Average Shift Length: ${avgShiftLength.toFixed(2)} hours</li>`;
      html += `<li>Most Common Location: ${mostCommonLocation || 'N/A'}</li>`;
      html += `<li>Swap Acceptance Rate: ${swapAcceptanceRate.toFixed(1)}%</li>`;
      if (isAdminUser && userWithMostSwaps) {
        html += `<li>User with Most Swaps: ${userWithMostSwaps[0]} (${userWithMostSwaps[1]})</li>`;
      }
      html += `</ul>`;
      // Generate PDF
      let pdfPath;
      if (Platform.OS === 'android') {
        pdfPath = `${RNFS.ExternalDirectoryPath}/ShiftBuddy_Analytics_${Date.now()}.pdf`;
      } else {
        pdfPath = `${RNFS.CachesDirectoryPath}/ShiftBuddy_Analytics_${Date.now()}.pdf`;
      }
      const { filePath } = await RNHTMLtoPDF.convert({
        html,
        fileName: pdfPath.split('/').pop().replace('.pdf',''),
        base64: false,
        directory: Platform.OS === 'android' ? RNFS.ExternalDirectoryPath : undefined,
      });
      if (filePath) {
        Alert.alert('PDF File Path', filePath);
        await ShareRN.open({
          url: 'file://' + filePath,
          type: 'application/pdf',
          failOnCancel: false,
        });
        Alert.alert('Exported', 'PDF report ready to share or save.');
      } else {
        throw new Error('No file path');
      }
    } catch (err) {
      console.error('PDF export error:', err);
      Alert.alert('Error', 'Failed to export PDF.');
    }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 24 }}>
      <Title>My Shift Analytics</Title>
      <Card>
        <Stat>Total Shifts: {totalShifts}</Stat>
        <Stat>Total Hours: {totalHours.toFixed(1)}</Stat>
        <Stat>Swaps Completed: {swapsCompleted}</Stat>
        <Stat>Open Shifts Filled: {openShiftsFilled}</Stat>
      </Card>
      {isAdmin && (
        <>
          <Title style={{ marginTop: 24 }}>Admin Analytics</Title>
          <Card>
            <Stat>Total Shifts: {adminTotalShifts}</Stat>
            <Stat>Open Shifts: {adminOpenShifts}</Stat>
            <Stat>Filled Open Shifts: {adminFilledOpenShifts}</Stat>
            <Stat>Total Swaps: {adminSwaps}</Stat>
            <Stat>Busiest Day: {busiestDay ? `${busiestDay[0]} (${busiestDay[1]})` : 'N/A'}</Stat>
          </Card>
          <Card>
            <Stat style={{ fontWeight: 'bold', marginBottom: 8 }}>Top Users by Shifts</Stat>
            {topUsers.length === 0 ? (
              <Stat style={{ color: '#aaa' }}>No user data</Stat>
            ) : (
              topUsers.map(([uid, count]) => (
                <View key={uid} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                  <Stat style={{ flex: 1 }}>{uid}</Stat>
                  <View style={{ height: 16, backgroundColor: '#8DB1A4', width: Math.max(20, count * 16), borderRadius: 8, marginRight: 8 }} />
                  <Stat>{count}</Stat>
                </View>
              ))
            )}
          </Card>
        </>
      )}
      <Card>
        <Stat style={{ fontWeight: 'bold', marginBottom: 8 }}>Advanced Analytics</Stat>
        <Stat>Average Shift Length: {avgShiftLength.toFixed(2)} hours</Stat>
        <Stat>Most Common Location: {mostCommonLocation || 'N/A'}</Stat>
        <Stat>Swap Acceptance Rate: {swapAcceptanceRate.toFixed(1)}%</Stat>
        {isAdmin && userWithMostSwaps && (
          <Stat>User with Most Swaps: {userWithMostSwaps[0]} ({userWithMostSwaps[1]})</Stat>
        )}
      </Card>
      <Card>
        <Stat style={{ fontWeight: 'bold', marginBottom: 8 }}>Shifts per Location</Stat>
        {locationData.length === 0 ? (
          <Stat style={{ color: '#aaa' }}>No location data</Stat>
        ) : (
          locationData.map(([loc, count]) => (
            <Stat key={loc}>{loc}: {count}</Stat>
          ))
        )}
      </Card>
      {/* Placeholder for future charts */}
      <Card>
        <Stat style={{ color: '#aaa' }}>[Charts coming soon]</Stat>
      </Card>
      <TouchableOpacity onPress={handleExportCSV} style={{ marginTop: 16, alignItems: 'center', backgroundColor: '#8DB1A4', borderRadius: 16, padding: 14 }}>
        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Export CSV</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={handleExportPDF} style={{ marginTop: 12, alignItems: 'center', backgroundColor: '#A15C48', borderRadius: 16, padding: 14 }}>
        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Export PDF</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 24, alignItems: 'center' }}>
        <Text style={{ color: '#A15C48', fontWeight: 'bold', fontSize: 16 }}>Back</Text>
      </TouchableOpacity>
    </ScrollView>
  );
} 