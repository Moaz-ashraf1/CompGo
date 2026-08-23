import { prisma } from "../../config/prisma.js";

export const findBoundary = async()=>{
    return prisma.compoundBoundary.findFirst({
        orderBy: {updatedAt: "desc"},
    })
}

export const upsertBoundary = async(points:{ lat: number; lng: number }[])=>{

    const existing = await prisma.compoundBoundary.findFirst();

    if(existing){
         return prisma.compoundBoundary.update({
          where: { id: existing.id },
          data: { points },
    });
    }
    return prisma.compoundBoundary.create({
        data: {points},
    })
}