"use client"

import { useState, useEffect, useCallback } from "react"
import type { Contract } from "ethers"
import { getProvider } from "@/lib/ethereum"
import { getContract, type Course } from "@/lib/contract"
import { parseMetadataUri } from "@/lib/pinata"

export function useContract() {
  const [contract, setContract] = useState<Contract | null>(null)
  const [account, setAccount] = useState<string | null>(null)
  const [isTeacher, setIsTeacher] = useState(false)
  const [isRegistered, setIsRegistered] = useState(false)
  const [credits, setCredits] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Initialize contract
  useEffect(() => {
    const init = async () => {
      try {
        if (typeof window !== "undefined" && window.ethereum) {
          // Get provider and contract
          const provider = getProvider()
          const contractInstance = await getContract(provider)
          setContract(contractInstance)

          // Get current account
          const accounts = await window.ethereum.request({ method: "eth_accounts" })
          const currentAccount = accounts.length > 0 ? accounts[0] : null
          setAccount(currentAccount)

          if (currentAccount) {
            // Check if user is registered
            const registered = await contractInstance.registered(currentAccount)
            setIsRegistered(registered)

            // Check if user is a teacher
            const teacherRole = await contractInstance.TEACHER_ROLE()
            const hasRole = await contractInstance.hasRole(teacherRole, currentAccount)
            setIsTeacher(hasRole)

            // Get user credits
            const creditId = await contractInstance.CREDIT()
            const userCredits = await contractInstance.balanceOf(currentAccount, creditId)
            setCredits(Number(userCredits))
          }
        }
      } catch (err) {
        console.error("Failed to initialize contract:", err)
        setError("Failed to connect to blockchain")
      } finally {
        setLoading(false)
      }
    }

    init()

    // Listen for account changes
    if (typeof window !== "undefined" && window.ethereum) {
      const handleAccountsChanged = async (accounts: string[]) => {
        setAccount(accounts.length > 0 ? accounts[0] : null)

        if (accounts.length > 0 && contract) {
          try {
            // Update registration status
            const registered = await contract.registered(accounts[0])
            setIsRegistered(registered)

            // Update teacher status
            const teacherRole = await contract.TEACHER_ROLE()
            const hasRole = await contract.hasRole(teacherRole, accounts[0])
            setIsTeacher(hasRole)

            // Update credits
            const creditId = await contract.CREDIT()
            const userCredits = await contract.balanceOf(accounts[0], creditId)
            setCredits(Number(userCredits))
          } catch (err) {
            console.error("Error updating account info:", err)
          }
        } else {
          setIsRegistered(false)
          setIsTeacher(false)
          setCredits(0)
        }
      }

      window.ethereum.on("accountsChanged", handleAccountsChanged)
      return () => {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged)
      }
    }
  }, [])

  // Register student
  const register = useCallback(async () => {
    if (!contract || !account) {
      throw new Error("Contract or account not available")
    }

    try {
      const tx = await contract.register()
      await tx.wait()
      setIsRegistered(true)

      // Update credits
      const creditId = await contract.CREDIT()
      const userCredits = await contract.balanceOf(account, creditId)
      setCredits(Number(userCredits))

      return true
    } catch (err) {
      console.error("Registration error:", err)
      throw err
    }
  }, [contract, account])

  // Create course
  const createCourse = useCallback(
    async (capacity: number, metadataURI: string) => {
      if (!contract || !account || !isTeacher) {
        throw new Error("Not authorized to create courses")
      }

      try {
        const tx = await contract.createCourse(capacity, metadataURI)
        await tx.wait()
        return true
      } catch (err) {
        console.error("Course creation error:", err)
        throw err
      }
    },
    [contract, account, isTeacher],
  )

  // Place bid
  const placeBid = useCallback(
    async (courseId: number, bidAmount: number) => {
      if (!contract || !account || !isRegistered) {
        throw new Error("Not registered to place bids")
      }

      try {
        const tx = await contract.bid(courseId, bidAmount)
        await tx.wait()

        // Update credits
        const creditId = await contract.CREDIT()
        const userCredits = await contract.balanceOf(account, creditId)
        setCredits(Number(userCredits))

        return true
      } catch (err) {
        console.error("Bid error:", err)
        throw err
      }
    },
    [contract, account, isRegistered],
  )

  // Finalize bidding
  const finalizeBidding = useCallback(
    async (courseId: number) => {
      if (!contract || !account || !isTeacher) {
        throw new Error("Not authorized to finalize bidding")
      }

      try {
        const tx = await contract.finalizeBidding(courseId)
        await tx.wait()
        return true
      } catch (err) {
        console.error("Finalize bidding error:", err)
        throw err
      }
    },
    [contract, account, isTeacher],
  )

  // Get active courses
  const getActiveCourses = useCallback(async () => {
    if (!contract) {
      throw new Error("Contract not available")
    }

    try {
      const activeCourseIds = await contract.getActiveCourses()
      const courses: Course[] = []

      for (const id of activeCourseIds) {
        const courseData = await contract.courses(id)

        // Parse course data
        const course: Course = {
          courseId: Number(courseData[0]),
          teacher: courseData[1],
          capacity: Number(courseData[2]),
          biddingActive: courseData[3],
          finalized: courseData[4],
          metadataURI: courseData[5],
        }

        // Get bids for this course
        const [bidders, bidAmounts] = await contract.getBids(id)
        course.bids = bidders.map((bidder: string, index: number) => ({
          bidder,
          bidAmount: Number(bidAmounts[index]),
        }))

        courses.push(course)
      }

      return courses
    } catch (err) {
      console.error("Error getting active courses:", err)
      throw err
    }
  }, [contract])

  // Get finalized courses
  const getFinalizedCourses = useCallback(async () => {
    if (!contract) {
      throw new Error("Contract not available")
    }

    try {
      const finalizedCourseIds = await contract.getFinalizedCourses()
      const courses: Course[] = []

      for (const id of finalizedCourseIds) {
        const courseData = await contract.courses(id)

        // Parse course data
        const course: Course = {
          courseId: Number(courseData[0]),
          teacher: courseData[1],
          capacity: Number(courseData[2]),
          biddingActive: courseData[3],
          finalized: courseData[4],
          metadataURI: courseData[5],
        }

        // Get winners for this course
        const winners = await contract.getWinners(id)
        course.winners = winners

        // Get bids for this course
        const [bidders, bidAmounts] = await contract.getBids(id)
        course.bids = bidders.map((bidder: string, index: number) => ({
          bidder,
          bidAmount: Number(bidAmounts[index]),
        }))

        courses.push(course)
      }

      return courses
    } catch (err) {
      console.error("Error getting finalized courses:", err)
      throw err
    }
  }, [contract])

  // Get course details
  const getCourse = useCallback(
    async (courseId: number) => {
      if (!contract) {
        throw new Error("Contract not available")
      }

      try {
        const courseData = await contract.courses(courseId)

        // Parse course data
        const course: Course = {
          courseId: Number(courseData[0]),
          teacher: courseData[1],
          capacity: Number(courseData[2]),
          biddingActive: courseData[3],
          finalized: courseData[4],
          metadataURI: courseData[5],
        }

        // Get bids for this course
        const [bidders, bidAmounts] = await contract.getBids(courseId)
        course.bids = bidders.map((bidder: string, index: number) => ({
          bidder,
          bidAmount: Number(bidAmounts[index]),
        }))

        // If course is finalized, get winners
        if (course.finalized) {
          const winners = await contract.getWinners(courseId)
          course.winners = winners
        }

        return course
      } catch (err) {
        console.error(`Error getting course ${courseId}:`, err)
        throw err
      }
    },
    [contract],
  )

  // Get user's bids
  const getUserBids = useCallback(async () => {
    if (!contract || !account) {
      throw new Error("Contract or account not available")
    }

    try {
      // Get all course IDs
      const activeCourseIds = await contract.getActiveCourses()
      const finalizedCourseIds = await contract.getFinalizedCourses()
      const allCourseIds = [...activeCourseIds, ...finalizedCourseIds]

      const userBids = []

      for (const courseId of allCourseIds) {
        const [bidders, bidAmounts] = await contract.getBids(courseId)

        // Find user's bid for this course
        const userBidIndex = bidders.findIndex((bidder: string) => bidder.toLowerCase() === account.toLowerCase())

        if (userBidIndex !== -1) {
          // Get course data
          const courseData = await contract.courses(courseId)
          const metadata: any = await parseMetadataUri(courseData[5]);
          userBids.push({
            courseId: Number(courseId),
            courseName: metadata.name, // You might want to store course names in the contract
            bidAmount: Number(bidAmounts[userBidIndex]),
            biddingActive: courseData[3],
            finalized: courseData[4],
          })
        }
      }

      return userBids
    } catch (err) {
      console.error("Error getting user bids:", err)
      throw err
    }
  }, [contract, account])

  // Get user's winning courses
  const getUserWinningCourses = useCallback(async () => {
    if (!contract || !account) {
      throw new Error("Contract or account not available")
    }

    try {
      const finalizedCourseIds = await contract.getFinalizedCourses()
      const winningCourses = []

      for (const courseId of finalizedCourseIds) {
        const winners = await contract.getWinners(courseId)

        // Check if user is a winner
        if (winners.some((winner: string) => winner.toLowerCase() === account.toLowerCase())) {
          // Get course data
          const courseData = await contract.courses(courseId)

          winningCourses.push({
            id: Number(courseId),
            name: `Course #${courseId}`, // You might want to store course names in the contract
            teacher: courseData[1],
          })
        }
      }

      return winningCourses
    } catch (err) {
      console.error("Error getting winning courses:", err)
      throw err
    }
  }, [contract, account])

  return {
    contract,
    account,
    isTeacher,
    isRegistered,
    credits,
    loading,
    error,
    register,
    createCourse,
    placeBid,
    finalizeBidding,
    getActiveCourses,
    getFinalizedCourses,
    getCourse,
    getUserBids,
    getUserWinningCourses,
  }
}
