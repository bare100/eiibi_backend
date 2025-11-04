import React, { useEffect, useState } from 'react'
// @ts-ignore
import { ApiClient } from 'adminjs'
import {
  Box,
  Icon,
  Loader,
  // @ts-ignore
} from '@adminjs/design-system'
// @ts-ignore
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
// @ts-ignore
import dayjs from 'dayjs'

const getAllMonths = () => {
  const months = [];

  for (let i = 0; i < 12; i++) {
    const month = dayjs().month(i).format('MMMM');
    months.push(month);
  }

  return months;
};

const DashboardPage = () => {
  const [data, setData] = useState(null)
  const api = new ApiClient()


  const buildMonthlyChartData = (data) => {
    const { accountsPerMonth, postsPerMonth, paymentsPerMonth } = data || {}
    if (!accountsPerMonth || !postsPerMonth || !paymentsPerMonth) {
      return
    }

    const allMonths = getAllMonths().map((name) => ({
      name,
      accounts: 0,
      posts: 0,
      payments: 0,
    }))

    allMonths.forEach((month) => {
      const accPerMonth = accountsPerMonth.find((upm) => upm.month === month.name)
      const projPerMonth = postsPerMonth.find((upm) => upm.month === month.name)
      const payPerMonth = paymentsPerMonth.find((upm) => upm.month === month.name)

      month.accounts = Number(accPerMonth?.count || 0)
      month.posts = Number(projPerMonth?.count || 0)
      month.payments = Number(payPerMonth?.count || 0)
    })

    return allMonths
  }


  useEffect(() => {
    api
      .getDashboard()
      .then((response) => {
        const { data } = response
        const chartData = buildMonthlyChartData(data)
        setData({ ...(data as Record<string, unknown>), chartData })
      })
      .catch((error) => {
        // handle any errors
      })
  }, [])

  if (!data) {
    return <Loader />
  }

  return (

    <div
      style={{
        padding: 48,
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
        justifyContent: 'space-between',
      }}
    >
      <h1 style={{ fontSize: 32, fontWeight: 300, marginBottom: 16 }}>👋 Welcome to the Admin Panel!</h1>
      <div style={{
        display: 'flex',
        gap: 16,
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <a target="_blank" className="dashboard-link-card" href="/admin/resources/accounts">
          <Box variant="card" className="dashboard-stats-card" style={{ background: '#D1E9FC', color: '#061B64' }}>
            <Icon icon="User" size={48} />
            <h1 className='dashboard-stats-heading'>{data.accountsCount}</h1>
            <span>Accounts</span>
          </Box>
        </a>

        <a target="_blank" className="dashboard-link-card" href="/admin/resources/posts">
          <Box variant="card" className="dashboard-stats-card" style={{ background: '#D0F2FF', color: '#04297A' }}>
            <Icon icon="Box" size={48} />
            <h1 className='dashboard-stats-heading'>{data.postsCount}</h1>
            <span>Posts</span>
          </Box>
        </a>

        <a target="_blank" className="dashboard-link-card" href="/admin/resources/payments">
          <Box variant="card" className="dashboard-stats-card" style={{ background: '#FFF7CD', color: '#7A4F01' }}>
            <Icon icon="DollarSign" size={48} />
            <h1 className='dashboard-stats-heading'>{data.paymentsCount}</h1>
            <span>Payments</span>
          </Box>
        </a>

      </div>

      <Box variant="card" style={{ borderRadius: 4 }}>
        <h2 style={{
          fontSize: 28,
          fontWeight: 300,
          marginBottom: 32
        }}>Current year progress</h2>
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart
            height={400}
            data={data.chartData}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />

            <Area type="monotone" dataKey="accounts" stroke="#83a6ed" fill="#83a6ed" />
            <Area type="monotone" dataKey="posts" stroke="#82ca9d" fill="#82ca9d" activeDot={{ r: 8 }} />
            <Area type="monotone" dataKey="payments" stroke="#ffc658" fill="#ffc658" />
          </AreaChart>
        </ResponsiveContainer>

      </Box>
    </div>
  )
}

export default DashboardPage

